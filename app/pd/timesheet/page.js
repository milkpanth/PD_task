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

/** Extract short display name from email: "somchai.p@company.com" → "Somchai P." */
function shortName(email) {
  if (!email) return '??';
  const local = email.split('@')[0]; // e.g. "somchai.p" or "somchai_p"
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) {
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase() + '.';
    return `${first} ${lastInitial}`;
  }
  return local.charAt(0).toUpperCase() + local.slice(1);
}

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
  const [viewOnly, setViewOnly] = useState(false);

  const currentUserId = session?.user?.id;

  // Show ALL team entries (not just self) so everyone can see each other's schedule
  const allEntries = useMemo(
    () => (data.timesheets || []).filter(t => t.userId),
    [data.timesheets]
  );

  // Build a lookup: userId → email (for display names)
  const profileMap = useMemo(() => {
    const map = {};
    (data.profiles || []).forEach(p => { map[p.id] = p; });
    return map;
  }, [data.profiles]);

  const byDate = useMemo(() => {
    const map = {};
    allEntries.forEach(e => { (map[e.date] ||= []).push(e); });
    return map;
  }, [allEntries]);

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

  function openAddFor(iso) { setEditEntry(null); setViewOnly(false); setSelectedDate(iso); setModalOpen(true); }
  function openEntry(entry) {
    const isOwner = entry.userId === currentUserId;
    setEditEntry(entry);
    setViewOnly(!isOwner);
    setModalOpen(true);
  }

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
          const isToday = c.iso === todayISO();
          const isSelected = c.iso === selectedDate;
          // Group entries by person for a compact display
          const peopleSummary = [];
          const seen = new Set();
          entries.forEach(e => {
            if (seen.has(e.userId)) return;
            seen.add(e.userId);
            const profile = profileMap[e.userId];
            const name = shortName(profile?.email || e.userEmail);
            const isLeave = e.entryType === 'leave';
            peopleSummary.push({ name, isLeave, userId: e.userId });
          });

          return (
            <div
              key={c.iso}
              className={`tscal-cell ${!c.inMonth ? 'outside' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => c.inMonth && setSelectedDate(c.iso)}
            >
              <div className="tscal-daynum">{c.date.getDate()}</div>
              {peopleSummary.slice(0, 3).map(p => (
                <div key={p.userId} className={`tscal-pill ${p.isLeave ? 'leave' : 'work'}`}>
                  {p.isLeave ? '🌴' : '🟢'} {p.name}
                </div>
              ))}
              {peopleSummary.length > 3 && <div className="tscal-more">+{peopleSummary.length - 3} คน</div>}
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
          const profile = profileMap[e.userId];
          const name = shortName(profile?.email || e.userEmail);
          const isOwner = e.userId === currentUserId;
          return (
            <div key={e.id} className="ts-detail-item" style={{ cursor: 'pointer' }} onClick={() => openEntry(e)}>
              <div style={{ flex: 1 }}>
                <div className="ts-detail-item-owner" style={{ fontSize: 11, fontWeight: 600, color: isOwner ? 'var(--accent)' : 'var(--text2)', marginBottom: 2 }}>
                  {name} {isOwner && <span style={{ fontSize: 10, opacity: 0.7 }}>(ฉัน)</span>}
                </div>
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
              {isOwner && <button className="task-action-btn" onClick={(ev) => { ev.stopPropagation(); openEntry(e); }}>✎</button>}
            </div>
          );
        })}
      </div>

      <TimesheetModal open={modalOpen} onClose={() => setModalOpen(false)} entry={editEntry} presetDate={selectedDate} viewOnly={viewOnly} />
    </div>
  );
}
