'use client';
import { useStore } from '../lib/StoreContext';
import { SCHEMAS, genericStatusColor, genericPriorityColor } from '../lib/schemas';

export default function GenericTable({ type, projectId }) {
  const { data, openGenericEdit } = useStore();
  const schema = SCHEMAS[type];
  const all = data[schema.table] || [];
  const rows = schema.global ? all : all.filter(r => r.project === projectId);
  const projects = data.projects || [];
  const projectName = (id) => projects.find(p => p.id === id)?.name || '-';

  // Resolve master data lookups for masterSelect fields
  const masterLookups = {};
  schema.fields.forEach(f => {
    if (f.type === 'masterSelect' && f.masterTable) {
      const masterRows = data[f.masterTable] || [];
      masterLookups[f.key] = (id) => masterRows.find(m => m.id === id)?.[f.masterLabel || 'name'] || '-';
    }
  });

  if (!rows.length) {
    return (
      <div className="empty-state">
        <div className="emoji">{schema.icon}</div>
        <p>ยังไม่มี {schema.label} — กด &quot;+ {schema.label} ใหม่&quot; เพื่อเริ่ม</p>
      </div>
    );
  }

  const cols = schema.fields;
  return (
    <table className="devtask-table">
      <thead>
        <tr>
          <th>No.</th>
          {cols.map(f => <th key={f.key}>{f.label}</th>)}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id}>
            <td>{i + 1}</td>
            {cols.map(f => {
              const val = r[f.key] || '-';
              if (f.type === 'masterSelect') return <td key={f.key}>{masterLookups[f.key] ? masterLookups[f.key](r[f.key]) : val}</td>;
              if (f.type === 'projectSelect') return <td key={f.key}>{val === '-' ? '-' : projectName(val)}</td>;
              if (f.badge === 'status') return <td key={f.key}><span className={`badge-pill ${genericStatusColor(val)}`}>{val}</span></td>;
              if (f.key === 'priority' || f.key === 'severity') return <td key={f.key}><span className={`priority-badge ${genericPriorityColor(val)}`}>{val}</span></td>;
              if (f.type === 'textarea') return <td key={f.key} className="dtd-cell">{val}</td>;
              return <td key={f.key}>{val}</td>;
            })}
            <td>
              <div className="dt-row-actions">
                <button className="task-action-btn" onClick={() => openGenericEdit(type, r.id, projectId)}>✎</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
