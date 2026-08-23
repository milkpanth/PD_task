import { NextResponse } from 'next/server';
import { createWorkPackage, openProjectReady } from '../../../../lib/openproject';

// Called from DevTaskModal's "Sync ไป OpenProject" button — creates the
// new work package as a CHILD of an existing parent ticket (e.g. a
// Feature) when parentTicketId is given.
// Body: { openProjectId: number, title: string, description?: string, parentTicketId?: number }
// The OpenProject API key never leaves the server — the browser only ever
// sees the resulting ticket id/url.
export async function POST(req) {
  if (!openProjectReady) {
    return NextResponse.json(
      { ok: false, error: 'ยังไม่ได้ตั้งค่า OpenProject บน server (OPENPROJECT_BASE_URL / OPENPROJECT_API_KEY)' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json body' }, { status: 400 });
  }

  const { openProjectId, title, description, parentTicketId } = body || {};
  if (!openProjectId) {
    return NextResponse.json({ ok: false, error: 'Project นี้ยังไม่ได้ผูกกับ OpenProject Project ID' }, { status: 400 });
  }
  if (!title || !title.trim()) {
    return NextResponse.json({ ok: false, error: 'ต้องมีชื่อ task ก่อน sync' }, { status: 400 });
  }

  try {
    const wp = await createWorkPackage({
      openProjectId, subject: title.trim(), description,
      parentId: parentTicketId || undefined,
    });
    return NextResponse.json({ ok: true, opTicketId: wp.id, opUrl: wp.url });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message || 'สร้าง work package บน OpenProject ไม่สำเร็จ' }, { status: 502 });
  }
}
