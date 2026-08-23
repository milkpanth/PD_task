'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../../../lib/StoreContext';
import { useAuth } from '../../../lib/AuthContext';
import DataGate from '../../../components/DataGate';
import TimesheetModal from '../../../components/TimesheetModal';

const MONTH_NAMES = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function toISO(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function todayISO() { return toISO(new Date()); }

export default function TimesheetPage() {
  return (
    <>
      <div className="topbar"><span className="topbar-title">PD Task · Timesheet</span></div>
      <div className="content"><DataGate><Body /></DataGate></div>
    </>
  );
}

function Body() {
  const { data } = useStore();
  const { session } = useAuth();
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const myEntries = useMemo(
    () => (data.timesheets || []).filter(t => t.userId === session?.user?.id),
    [data.timesheets, session]
  );

  const byDate = useMemo(() => {
    const map = {};
    myEntries.forEach(e => { (map[e.date] ||= []).push(e); });
    return map;
  }, [myEntries]);

  const cells = useMemo(() => {
    const { year, month } = view;
    const firstWeekday = new Date(year, month, 1).getDay();
    const list = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(year, month, 1 - firstWeekday + i);
      list.push({ date: d, iso: toISO(d), inMonth: d.getMonth() === month });
    }
    return list;
  }, [view]);

  function prevMonth() { setView(v => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 })); }
  function nextMonth() { setView(v => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 })); }
  function goToday() { setView({ year: today.getFullYear(), month: today.getMonth() }); setSelectedDate(todayISO()); }

  function openAddFor(iso) { setEditEntry(null); setSelectedDate(iso); setModalOpen(true); }
  function openEdit(entry) { setEditEntry(entry); setModalOpen(true); }

  const selectedEntries = byDate[selectedDate] || [];

  return (
    <div className="project-page">
      <div className="tscal-header">
        <div className="tscal-nav">
          <button onClick={prevMonth}>‹</button>
          <span className="tscal-month-label">{MONTH_NAMES[view.month]} {view.year + 543}</span>
          <button onClick={nextMonth}>›</button>
          <button style={{ width: 'auto', padding: '0 10px', fontSize: 12 }} onClick={goToday}>วันนี้</button>
        </div>
        <button className="btn btn-primary" onClick={() => openAddFor(selectedDate)}>＋ บันทึกเวลา</button>
      </div>

      <div className="tscal-grid">
        {WEEKDAYS.map(w => <div key={w} className="tscal-weekday">{w}</div>)}
        {cells.map(c => {
          const entries = byDate[c.iso] || [];
          const workEntries = entries.filter(e => e.entryType !== 'leave');
          const leaveEntries = entries.filter(e => e.entryType === 'leave');
          const isToday = c.iso === todayISO();
          const isSelected = c.iso === selectedDate;
          return (
            <div
              key={c.iso}
              className={`tscal-cell ${!c.inMonth ? 'outside' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => c.inMonth && setSelectedDate(c.iso)}
            >
              <div className="tscal-daynum">{c.date.getDate()}</div>
              {workEntries.slice(0, 1).map(e => (
                <div key={e.id} className="tscal-pill work">🟢 {e.timeIn || ''}{e.timeIn && e.timeOut ? '-' : ''}{e.timeOut || ''}</div>
              ))}
              {leaveEntries.slice(0, 1).map(e => (
                <div key={e.id} className="tscal-pill leave">🌴 {e.leaveType || 'ลา'}</div>
              ))}
              {entries.length > 2 && <div className="tscal-more">+{entries.length - 2} เพิ่มเติม</div>}
            </div>
          );
        })}
      </div>

      <div className="ts-detail-panel">
        <div className="ts-detail-title">
          <span>รายการวันที่ {selectedDate}</span>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => openAddFor(selectedDate)}>＋ เพิ่มรายการ</button>
        </div>
        {!selectedEntries.length ? (
          <div style={{ fontSize: 13, color: 'var(--text3)', padding: '10px 0' }}>ยังไม่มีรายการในวันนี้</div>
        ) : selectedEntries.map(e => {
          const project = (data.projects || []).find(p => p.id === e.projectId);
          return (
            <div key={e.id} className="ts-detail-item">
              <div>
                {e.entryType === 'leave' ? (
                  <>
                    <div className="ts-detail-item-main">🌴 {e.leaveType}</div>
                    {e.reason && <div className="ts-detail-item-sub">{e.reason}</div>}
                  </>
                ) : (
                  <>
                    <div className="ts-detail-item-main">🟢 {e.timeIn || '-'} – {e.timeOut || '-'} · {project ? project.name : 'Non-Project'}</div>
                    {e.workDetail && <div className="ts-detail-item-sub">{e.workDetail}</div>}
                  </>
                )}
              </div>
              <button className="task-action-btn" onClick={() => openEdit(e)}>✎</button>
            </div>
          );
        })}
      </div>

      <TimesheetModal open={modalOpen} onClose={() => setModalOpen(false)} entry={editEntry} presetDate={selectedDate} />
    </div>
  );
}