import { NextResponse } from 'next/server';
import { verifyOpSignature, workPackageUrl } from '../../../../lib/openproject';
import { supabaseAdmin, supabaseAdminReady } from '../../../../lib/supabaseAdmin';

// Configure in OpenProject: Administration → API and webhooks → Webhooks
//   Payload URL: https://<your-deployed-domain>/api/openproject/webhook
//   Signature secret: same value as the OPENPROJECT_WEBHOOK_SECRET env var
//   Events: Work packages (created)
//
// NOTE: this endpoint only reacts to "work_package:created" — it inserts a
// matching Dev Task row into the ONE TaskFlow project whose "openProjectId"
// matches the work package's project. Projects with no such mapping are
// silently ignored (nothing to sync into). Updates made to an existing
// work package on the OpenProject side are not synced back — only new
// tickets. If OpenProject's actual payload shape differs from what's
// parsed below, the raw body is logged so it can be adjusted.

const STATUS_MAP = {
  'new': 'todo', 'to do': 'todo', 'todo': 'todo', 'specified': 'todo',
  'in progress': 'inprogress', 'in specification': 'inprogress', 'confirmed': 'inprogress',
  'developed': 'review', 'in review': 'review', 'review': 'review', 'tested': 'review',
  'closed': 'donedt', 'done': 'donedt', 'rejected': 'donedt',
  'on hold': 'blocked', 'blocked': 'blocked',
};
const TYPE_MAP = {
  'bug': 'bug', 'feature': 'feature', 'task': 'task', 'phase': 'task',
  'milestone': 'task', 'epic': 'feature', 'user story': 'feature',
};

function mapStatus(name) {
  if (!name) return 'todo';
  return STATUS_MAP[name.trim().toLowerCase()] || 'todo';
}
function mapType(name) {
  if (!name) return 'task';
  return TYPE_MAP[name.trim().toLowerCase()] || 'task';
}
function idFromHref(href) {
  if (!href) return null;
  const m = String(href).match(/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-op-signature');
  const secret = process.env.OPENPROJECT_WEBHOOK_SECRET;

  if (!verifyOpSignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 });
  }
  if (!supabaseAdminReady) {
    console.error('[openproject webhook] SUPABASE_SERVICE_ROLE_KEY is not configured on the server');
    return NextResponse.json({ ok: false, error: 'server not configured' }, { status: 500 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const action = payload.action || '';
  if (action !== 'work_package:created') {
    return NextResponse.json({ ok: true, skipped: true, reason: `ignored action: ${action || 'unknown'}` });
  }

  const wp = payload.work_package || payload;
  const links = wp._links || {};
  const wpId = wp.id;
  const openProjectId = idFromHref(links.project?.href);

  if (!wpId || !openProjectId) {
    console.error('[openproject webhook] unrecognised payload shape:', rawBody.slice(0, 800));
    return NextResponse.json({ ok: true, skipped: true, reason: 'unrecognised payload shape' });
  }

  // Only sync into the ONE TaskFlow project explicitly mapped to this
  // OpenProject project — anything unmapped is intentionally ignored.
  const { data: project, error: projErr } = await supabaseAdmin
    .from('projects').select('id').eq('openProjectId', openProjectId).maybeSingle();

  if (projErr) {
    console.error('[openproject webhook] project lookup failed:', projErr.message);
    return NextResponse.json({ ok: false, error: projErr.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'openProjectId not mapped to any TaskFlow project' });
  }

  // Duplicate delivery guard — OpenProject may retry a webhook call.
  const { data: existing } = await supabaseAdmin
    .from('devTasks').select('id').eq('opTicketId', wpId).maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already synced' });
  }

  const row = {
    project: project.id,
    name: wp.subject || `Work package #${wpId}`,
    ticket: `#${wpId}`,
    opTicketId: wpId,
    opParentId: idFromHref(links.parent?.href),
    opUrl: workPackageUrl(wpId),
    status: mapStatus(links.status?.title),
    type: mapType(links.type?.title),
    assignee: links.assignee?.title || '',
    opAssignee: links.assignee?.title || '',
    opPriority: links.priority?.title || 'Normal',
  };

  const { error: insertErr } = await supabaseAdmin.from('devTasks').insert(row);
  if (insertErr) {
    console.error('[openproject webhook] insert failed:', insertErr.message);
    return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
