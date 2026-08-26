'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../../../lib/StoreContext';
import { useAuth } from '../../../lib/AuthContext';
import DataGate from '../../../components/DataGate';
import GenericTable from '../../../components/GenericTable';
import { SCHEMAS } from '../../../lib/schemas';

const TYPE = 'pdtask';

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: toISO(mon), end: toISO(sun) };
}

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function Page() {
  const { openGenericAdd, data } = useStore();
  const { session } = useAuth();
  const schema = SCHEMAS[TYPE];

  const [filterMine, setFilterMine] = useState(false);
  const [dateMode, setDateMode] = useState('week'); // 'week' | 'all' | 'custom'
  const week = getWeekRange();
  const [customStart, setCustomStart] = useState(week.start);
  const [customEnd, setCustomEnd] = useState(week.end);

  const myName = session?.user?.email?.split('@')[0]?.toLowerCase() || '';
  const myId = session?.user?.id || '';
  const allTasks = data[schema.table] || [];

  const filterFn = useMemo(() => {
    return (t) => {
      // Mine filter
      if (filterMine) {
        const a = (t.assignee || '').toLowerCase();
        if (a !== myName && t.userId !== myId) return false;
      }
      // Date filter
      if (dateMode === 'all') return true;
      const rangeStart = dateMode === 'week' ? week.start : customStart;
      const rangeEnd = dateMode === 'week' ? week.end : customEnd;
      // Show tasks with no date OR tasks that overlap with the range
      if (!t.startDate && !t.endDate) return true; // no date = always show
      const tStart = t.startDate || t.endDate;
      const tEnd = t.endDate || t.startDate;
      return tStart <= rangeEnd && tEnd >= rangeStart;
    };
  }, [filterMine, dateMode, customStart, customEnd, myName, myId, week.start, week.end]);

  const filtered = allTasks.filter(filterFn);

  const dateLabel = dateMode === 'week' ? `สัปดาห์นี้ (${week.start} — ${week.end})`
    : dateMode === 'all' ? 'ทั้งปี'
    : `${customStart} — ${customEnd}`;

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">PD Task · Task List</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => openGenericAdd(TYPE)}>＋ Task ใหม่</button>
        </div>
      </div>
      <div className="content">
        <DataGate>
          <div className="project-page">
            <div className="proj-toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span className="proj-toolbar-title">รายการ {schema.label} ({filtered.length})</span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div className="ts-view-tabs">
                  <span className={`filter-btn ${!filterMine ? 'active' : ''}`} onClick={() => setFilterMine(false)}>ทั้งหมด</span>
                  <span className={`filter-btn ${filterMine ? 'active' : ''}`} onClick={() => setFilterMine(true)}>ของฉัน</span>
                </div>
                <div className="ts-view-tabs">
                  <span className={`filter-btn ${dateMode === 'week' ? 'active' : ''}`} onClick={() => setDateMode('week')}>สัปดาห์นี้</span>
                  <span className={`filter-btn ${dateMode === 'all' ? 'active' : ''}`} onClick={() => setDateMode('all')}>ทั้งปี</span>
                  <span className={`filter-btn ${dateMode === 'custom' ? 'active' : ''}`} onClick={() => setDateMode('custom')}>กำหนดเอง</span>
                </div>
                {dateMode === 'custom' && (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input type="date" className="form-input" style={{ fontSize: 11, padding: '2px 6px', width: 130 }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                    <input type="date" className="form-input" style={{ fontSize: 11, padding: '2px 6px', width: 130 }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{dateLabel}{filterMine ? ' · ของฉัน' : ''} · รวม task ที่ยังไม่ใส่วันที่</div>
            <div className="devtask-scroll"><GenericTable type={TYPE} filterFn={filterFn} /></div>
          </div>
        </DataGate>
      </div>
    </>
  );
}
