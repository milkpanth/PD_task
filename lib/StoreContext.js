'use client';
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase, supabaseReady } from './supabaseClient';
import { SCHEMAS } from './schemas';
import { useAuth } from './AuthContext';
import { logActivity, labelFor } from './activityLog';

const StoreContext = createContext(null);

const TABLES = {
  projects: 'projects',
  tasks: 'tasks',
  products: 'products',
  devTasks: 'devTasks',
  wbs: 'wbs',
  requirements: 'requirements',
  sprints: 'sprints',
  members: 'members',
  defects: 'defects',
  changeLog: 'changeLog',
  pdTasks: 'pdTasks',
  pdIssues: 'pdIssues',
  pdBacklog: 'pdBacklog',
  pdFeedback: 'pdFeedback',
  timesheets: 'timesheets',
  profiles: 'profiles',
  productMasters: 'productMasters',
  pdMom: 'pdMom',
  holidays: 'holidays',
};

const EMPTY = Object.fromEntries(Object.keys(TABLES).map(k => [k, []]));

export function StoreProvider({ children }) {
  const { perms, session } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [confirmState, setConfirmState] = useState(null); // {title, body, onOk}
  const [genericModal, setGenericModal] = useState(null); // {type, editId, presets}

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toast._t);
    toast._t = setTimeout(() => setToastMsg(''), 2500);
  }, []);

  const confirm = useCallback((title, body, onOk) => {
    setConfirmState({ title, body, onOk });
  }, []);

  const loadAll = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const entries = Object.entries(TABLES);
      const results = await Promise.all(
        entries.map(([, table]) => supabase.from(table).select('*').order('createdAt', { ascending: true }))
      );
      const next = {};
      results.forEach((res, i) => {
        const [key] = entries[i];
        if (res.error) throw res.error;
        next[key] = res.data || [];
      });
      setData(next);
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Generic CRUD helpers, keyed by the `data` key (e.g. "tasks", "projects", "pdTasks")
  const addRow = useCallback(async (key, row) => {
    const table = TABLES[key];
    const { data: inserted, error } = await supabase.from(table).insert(row).select().single();
    if (error) { toast('❌ บันทึกไม่สำเร็จ: ' + error.message); throw error; }
    setData(d => ({ ...d, [key]: [...d[key], inserted] }));
    logActivity(supabase, {
      userId: session?.user?.id, userEmail: session?.user?.email,
      action: 'create', entityType: key, entityId: inserted.id, detail: labelFor(inserted),
    });
    return inserted;
  }, [toast, session]);

  const updateRow = useCallback(async (key, id, patch) => {
    const table = TABLES[key];
    const { data: updated, error } = await supabase.from(table).update(patch).eq('id', id).select().single();
    if (error) { toast('❌ อัปเดตไม่สำเร็จ: ' + error.message); throw error; }
    setData(d => ({ ...d, [key]: d[key].map(r => (r.id === id ? updated : r)) }));
    logActivity(supabase, {
      userId: session?.user?.id, userEmail: session?.user?.email,
      action: 'update', entityType: key, entityId: id, detail: labelFor(updated),
    });
    return updated;
  }, [toast, session]);

  const deleteRow = useCallback(async (key, id) => {
    if (!perms.canDelete) {
      toast('⛔ สิทธิ์ของคุณไม่สามารถลบข้อมูลได้');
      throw new Error('Forbidden: role cannot delete');
    }
    const table = TABLES[key];
    const existing = data[key]?.find(r => r.id === id);
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { toast('❌ ลบไม่สำเร็จ: ' + error.message); throw error; }
    setData(d => ({ ...d, [key]: d[key].filter(r => r.id !== id) }));
    logActivity(supabase, {
      userId: session?.user?.id, userEmail: session?.user?.email,
      action: 'delete', entityType: key, entityId: id, detail: labelFor(existing),
    });
  }, [toast, perms.canDelete, session, data]);

  // Generic-schema CRUD (Requirement/Sprint/Member/Defect/PD*)
  const openGenericAdd = useCallback((type, presets, projectId) => {
    setGenericModal({ type, editId: null, presets: presets || null, projectId });
  }, []);
  const openGenericEdit = useCallback((type, id, projectId) => {
    setGenericModal({ type, editId: id, presets: null, projectId });
  }, []);
  const closeGenericModal = useCallback(() => setGenericModal(null), []);

  const saveGeneric = useCallback(async (type, editId, projectId, values) => {
    const schema = SCHEMAS[type];
    const payload = { ...values };
    if (!schema.global) payload.project = projectId;
    // Auto-track doneAt for pdTasks
    if (schema.table === 'pdTasks' && editId) {
      const existing = (data[schema.table] || []).find(r => r.id === editId);
      if (payload.status === 'Done' && existing?.status !== 'Done') {
        payload.doneAt = new Date().toISOString();
      } else if (payload.status !== 'Done' && existing?.status === 'Done') {
        payload.doneAt = null;
      }
    } else if (schema.table === 'pdTasks' && !editId && payload.status === 'Done') {
      payload.doneAt = new Date().toISOString();
    }
    if (editId) {
      await updateRow(schema.table, editId, payload);
      toast('✏️ อัปเดตแล้ว');
    } else {
      await addRow(schema.table, payload);
      toast('✅ เพิ่มแล้ว');
    }
    setGenericModal(null);
  }, [addRow, updateRow, toast, data]);

  const deleteGeneric = useCallback((type, id) => {
    const schema = SCHEMAS[type];
    confirm('ลบรายการนี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow(schema.table, id);
      setGenericModal(null);
      toast('🗑️ ลบแล้ว');
    });
  }, [confirm, deleteRow, toast]);

  const value = useMemo(() => ({
    data, loading, error, reload: loadAll,
    addRow, updateRow, deleteRow,
    toast, confirm, setConfirmState,
    genericModal, openGenericAdd, openGenericEdit, closeGenericModal, saveGeneric, deleteGeneric,
    toastMsg, confirmState,
  }), [data, loading, error, loadAll, addRow, updateRow, deleteRow, toast, confirm,
      genericModal, openGenericAdd, openGenericEdit, closeGenericModal, saveGeneric, deleteGeneric,
      toastMsg, confirmState]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
