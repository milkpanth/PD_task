'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';
import { useAuth } from '../lib/AuthContext';
import { SCHEMAS } from '../lib/schemas';

function nextAutoId(rows, key, prefix, pad) {
  let max = 0;
  rows.forEach(r => {
    const m = String(r[key] || '').match(new RegExp(`^${prefix}(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return prefix + String(max + 1).padStart(pad, '0');
}

export default function GenericModal() {
  const { genericModal, closeGenericModal, data, saveGeneric, deleteGeneric } = useStore();
  const { perms } = useAuth();
  const [values, setValues] = useState({});
  const projects = data.projects || [];

  const open = !!genericModal;
  const schema = genericModal ? SCHEMAS[genericModal.type] : null;
  const row = open && genericModal.editId
    ? (data[schema.table] || []).find(r => r.id === genericModal.editId)
    : null;

  useEffect(() => {
    if (!open) return;
    const base = {};
    schema.fields.forEach(f => {
      if (f.type === 'autoId' && !row) {
        const scoped = schema.global
          ? (data[schema.table] || [])
          : (data[schema.table] || []).filter(r => r.project === genericModal.projectId);
        base[f.key] = nextAutoId(scoped, f.key, f.prefix || '', f.pad || 3);
      } else {
        base[f.key] = (row ? row[f.key] : genericModal.presets?.[f.key]) || '';
      }
    });
    setValues(base);
  }, [open, genericModal, row, schema, data]);

  if (!open) return null;

  function setField(k, v) { setValues(prev => ({ ...prev, [k]: v })); }

  async function handleSave() {
    const requiredFields = schema.fields.filter(f => f.required || f.key === 'title' || f.key === 'name');
    for (const f of requiredFields) {
      if (!values[f.key]?.toString().trim()) return;
    }
    await saveGeneric(genericModal.type, genericModal.editId, genericModal.projectId, values);
  }

  return (
    <Modal open={open} onClose={closeGenericModal} width="560px">
      <div className="modal-title">
        {genericModal.editId ? `✎ แก้ไข ${schema.label}` : `${schema.icon} ${schema.label} ใหม่`}
      </div>
      <div>
        {schema.fields.map(f => (
          <div className="form-group" key={f.key}>
            <label className="form-label">{f.label}</label>
            {f.type === 'textarea' && (
              <textarea className="form-textarea" value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)} />
            )}
            {f.type === 'select' && (
              <select className="form-select" value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)}>
                <option value="">—</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            {f.type === 'date' && (
              <input type="date" className="form-input" value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)} />
            )}
            {f.type === 'time' && (
              <input type="time" className="form-input" value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)} />
            )}
            {f.type === 'projectSelect' && (
              <select className="form-select" value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)}>
                <option value="">— เลือก Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {f.type === 'masterSelect' && (
              <select className="form-select" value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)}>
                <option value="">— เลือก {f.label} —</option>
                {(data[f.masterTable] || []).map(m => <option key={m.id} value={m.id}>{m[f.masterLabel || 'name']}</option>)}
              </select>
            )}
            {f.type === 'profileSelect' && (
              <select className="form-select" value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)}>
                <option value="">— เลือก {f.label} —</option>
                {(data.profiles || []).map(p => <option key={p.id} value={p.email.split('@')[0]}>{p.email.split('@')[0]} ({p.role})</option>)}
              </select>
            )}
            {f.type === 'autoId' && (
              <input type="text" className="form-input" value={values[f.key] || ''} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            )}
            {f.type === 'text' && (
              <input type="text" className="form-input" value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)} />
            )}
          </div>
        ))}
      </div>
      <div className="modal-actions-split">
        {genericModal.editId && (perms.canDelete || (schema.table === 'productMasters' && perms.canAccessConfig)) ? (
          <button className="btn btn-danger" onClick={() => deleteGeneric(genericModal.type, genericModal.editId)}>🗑 ลบ</button>
        ) : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={closeGenericModal}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSave}>บันทึก</button>
        </div>
      </div>
    </Modal>
  );
}
