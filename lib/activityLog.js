// Writes one row to the activityLogs audit table. Never throws — a logging
// failure should never break the user's actual action (save, delete, login...).
export async function logActivity(supabase, { userId, userEmail, action, entityType, entityId, detail }) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('activityLogs').insert({
      userId,
      userEmail: userEmail || '',
      action,
      entityType: entityType || '',
      entityId: entityId != null ? String(entityId) : '',
      detail: detail || '',
    });
  } catch (e) {
    console.error('[activity log] failed to write:', e?.message || e);
  }
}

// Best-effort human-readable label for a data row, used as the log's
// "detail" column so entries read as e.g. "แก้ไข: Hourly Sale" instead of
// just a bare uuid.
export function labelFor(row) {
  if (!row) return '';
  return row.name || row.title || row.subject || row.email || '';
}
