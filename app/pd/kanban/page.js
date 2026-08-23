'use client';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../../lib/StoreContext';
import DataGate from '../../../components/DataGate';
import { genericPriorityColor } from '../../../lib/schemas';

const COLS = ['To do', 'In Progress', 'In Review', 'Done'];

export default function PdKanbanPage() {
  return (
    <>
      <div className="topbar"><span className="topbar-title">PD Task · Kanban</span></div>
      <div className="content"><DataGate><Body /></DataGate></div>
    </>
  );
}

function groupByStatus(tasks) {
  const map = {};
  COLS.forEach(c => { map[c] = []; });
  (tasks || []).forEach(t => {
    const st = COLS.includes(t.status) ? t.status : 'To do';
    map[st].push(t);
  });
  COLS.forEach(c => {
    map[c].sort((a, b) => {
      const oa = a.order ?? 0, ob = b.order ?? 0;
      if (oa !== ob) return oa - ob;
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
  });
  return map;
}

function Body() {
  const { data, openGenericAdd, openGenericEdit, updateRow } = useStore();
  const tasks = data.pdTasks;

  const [cols, setCols] = useState(() => groupByStatus(tasks));
  const dragRef = useRef(null); // { id }
  const draggingRef = useRef(false);
  const committedRef = useRef(false);

  // Resync from server data whenever it changes, unless a drag is in progress
  // (so we don't fight the live preview while the user is dragging).
  useEffect(() => {
    if (!draggingRef.current) setCols(groupByStatus(tasks));
  }, [tasks]);

  function moveCard(overStatus, overIndex) {
    const drag = dragRef.current;
    if (!drag) return;
    setCols(prev => {
      const next = {};
      COLS.forEach(c => { next[c] = [...prev[c]]; });
      let draggedCard = null;
      for (const c of COLS) {
        const idx = next[c].findIndex(t => t.id === drag.id);
        if (idx !== -1) { [draggedCard] = next[c].splice(idx, 1); break; }
      }
      if (!draggedCard) return prev;
      const targetArr = next[overStatus];
      const insertAt = overIndex == null ? targetArr.length : Math.min(Math.max(overIndex, 0), targetArr.length);
      targetArr.splice(insertAt, 0, draggedCard);
      return next;
    });
  }

  function handleDragStart(e, task) {
    dragRef.current = { id: task.id };
    draggingRef.current = true;
    committedRef.current = false;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', task.id); } catch {}
  }

  function handleCardDragOver(e, overTask, status) {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRef.current || dragRef.current.id === overTask.id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height / 2;
    const idx = cols[status].findIndex(t => t.id === overTask.id);
    moveCard(status, before ? idx : idx + 1);
  }

  function handleColumnDragOver(e, status) {
    e.preventDefault();
    if (!dragRef.current) return;
    const arr = cols[status];
    const last = arr[arr.length - 1];
    if (last && last.id === dragRef.current.id) return;
    moveCard(status, arr.length);
  }

  async function handleDrop(e, status) {
    e.preventDefault();
    const drag = dragRef.current;
    if (!drag) return;
    committedRef.current = true;
    dragRef.current = null;
    draggingRef.current = false;

    const updates = [];
    COLS.forEach(colStatus => {
      cols[colStatus].forEach((t, idx) => {
        const newOrder = idx * 10;
        if (t.status !== colStatus || (t.order ?? 0) !== newOrder) {
          updates.push({ id: t.id, patch: { status: colStatus, order: newOrder } });
        }
      });
    });
    if (updates.length) {
      try {
        await Promise.all(updates.map(u => updateRow('pdTasks', u.id, u.patch)));
      } catch (err) {
        // updateRow already surfaces a toast on failure; the next data
        // refresh will resync the board to the true server state.
      }
    }
  }

  function handleDragEnd() {
    if (!committedRef.current) {
      // Drop happened outside a valid column — snap back to server state.
      setCols(groupByStatus(tasks));
    }
    committedRef.current = false;
    dragRef.current = null;
    draggingRef.current = false;
  }

  return (
    <div className="timeline-page">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Kanban</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>To do → In Progress → In Review → Done · ลากการ์ดเพื่อย้ายสถานะหรือจัดเรียงลำดับ</div>
      </div>
      <div className="pdk-board">
        {COLS.map(col => {
          const items = cols[col] || [];
          return (
            <div
              key={col}
              className="pdk-col"
              onDragOver={(e) => handleColumnDragOver(e, col)}
              onDrop={(e) => handleDrop(e, col)}
            >
              <div className="pdk-col-head">
                <div className="pdk-col-title">{col}</div>
                <div className="pdk-col-count">{items.length} task{items.length === 1 ? '' : 's'}</div>
              </div>
              <div className="pdk-col-body">
                {!items.length && <div className="pdk-empty">ยังไม่มี task</div>}
                {items.map(t => (
                  <div
                    key={t.id}
                    className="pdk-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, t)}
                    onDragOver={(e) => handleCardDragOver(e, t, col)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openGenericEdit('pdtask', t.id)}
                  >
                    <div className="pdk-card-title">{t.title || '(ไม่มีชื่อ)'}</div>
                    <div className="pdk-card-tags">
                      {t.assignee && <span className="tag" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>{t.assignee}</span>}
                      <span className={`priority-badge ${genericPriorityColor(t.priority)}`}>{(t.priority || 'Low').toUpperCase()}</span>
                    </div>
                  </div>
                ))}
                <button className="pdk-add-btn" onClick={() => openGenericAdd('pdtask', { status: col })}>＋ Task</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
