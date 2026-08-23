// Server-only helpers for talking to the OpenProject REST API (v3).
// NEVER import this file from a 'use client' component — it reads secret
// server env vars (OPENPROJECT_API_KEY) that must never reach the browser.
// Safe to import only from files under app/api/**/route.js.
import crypto from 'crypto';

const BASE_URL = (process.env.OPENPROJECT_BASE_URL || '').replace(/\/$/, '');
const API_KEY = process.env.OPENPROJECT_API_KEY;

export const openProjectReady = Boolean(BASE_URL && API_KEY);

function authHeader() {
  const token = Buffer.from(`apikey:${API_KEY}`).toString('base64');
  return `Basic ${token}`;
}

async function opFetch(path, options = {}) {
  if (!openProjectReady) {
    throw new Error('OpenProject ยังไม่ได้ตั้งค่าบน server (OPENPROJECT_BASE_URL / OPENPROJECT_API_KEY)');
  }
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
      ...(options.headers || {}),
    },
  });
}

// Creates a work package under the given OpenProject project (numeric id
// or identifier string both work per the OpenProject API). When parentId
// is given, the new work package is created as a CHILD of that work
// package (e.g. a Feature ticket) via the "_links.parent" relation.
export async function createWorkPackage({ openProjectId, subject, description, parentId }) {
  const res = await opFetch(`/api/v3/projects/${openProjectId}/work_packages`, {
    method: 'POST',
    body: JSON.stringify({
      subject,
      ...(description ? { description: { format: 'markdown', raw: description } } : {}),
      ...(parentId ? { _links: { parent: { href: `/api/v3/work_packages/${parentId}` } } } : {}),
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.message || `OpenProject API error (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return { id: json.id, subject: json.subject, url: workPackageUrl(json.id) };
}

export function workPackageUrl(id) {
  return `${BASE_URL}/work_packages/${id}`;
}

// Verifies OpenProject's webhook signature. When a "Signature secret" is
// configured on the OpenProject webhook, every delivery is signed with
// HMAC-SHA1 over the raw request body and sent as:
//   X-OP-Signature: sha1=<hex digest>
// Returns true if no secret is configured (signature check disabled) —
// callers should warn/log when that's the case since it's not recommended.
export function verifyOpSignature(rawBody, signatureHeader, secret) {
  if (!secret) return true;
  if (!signatureHeader) return false;
  const expected = 'sha1=' + crypto.createHmac('sha1', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
