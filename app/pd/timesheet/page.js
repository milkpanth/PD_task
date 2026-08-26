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
  const { session, role } = useAuth();
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'weekly'
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekScope, setWeekScope] = useState('mine'); // 'mine' | 'team'

  const currentUserId = session?.user?.id;
  const canViewTeam = ['Super Admin', 'CTO', 'PD Manager'].includes(role);

  // PD Team sees only their own entries; managers see everyone
  const allEntries = useMemo(
    () => {
      const entries = (data.timesheets || []).filter(t => t.userId);
      return canViewTeam ? entries : entries.filter(t => t.userId === currentUserId);
    },
    [data.timesheets, canViewTeam, currentUserId]
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

  // Weekly view helpers
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + weekOffset * 7); // Monday
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({ date: d, iso: toISO(d) });
    }
    return days;
  }, [weekStart]);

  const weekEntries = useMemo(() => {
    const isos = new Set(weekDays.map(d => d.iso));
    let entries = allEntries.filter(e => isos.has(e.date));
    if (weekScope === 'mine') entries = entries.filter(e => e.userId === currentUserId);
    return entries;
  }, [allEntries, weekDays, weekScope, currentUserId]);

  const HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

  function timeToMinutes(t) {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  return (
    <div className="project-page">
      <div className="tscal-header">
        <div className="tscal-nav">
          <div className="ts-view-tabs">
            <span className={`filter-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>📅 Calendar</span>
            <span className={`filter-btn ${viewMode === 'weekly' ? 'active' : ''}`} onClick={() => setViewMode('weekly')}>📊 Weekly</span>
          </div>
          {viewMode === 'calendar' && (
            <>
              <button onClick={prevMonth}>‹</button>
              <span className="tscal-month-label">{MONTH_NAMES[view.month]} {view.year + 543}</span>
              <button onClick={nextMonth}>›</button>
              <button style={{ width: 'auto', padding: '0 10px', fontSize: 12 }} onClick={goToday}>วันนี้</button>
            </>
          )}
          {viewMode === 'weekly' && (
            <>
              <button onClick={() => setWeekOffset(w => w - 1)}>‹</button>
              <span className="tscal-month-label">{weekDays[0].iso} — {weekDays[6].iso}</span>
              <button onClick={() => setWeekOffset(w => w + 1)}>›</button>
              <button style={{ width: 'auto', padding: '0 10px', fontSize: 12 }} onClick={() => setWeekOffset(0)}>สัปดาห์นี้</button>
              {canViewTeam && (
                <div className="ts-view-tabs" style={{ marginLeft: 12 }}>
                  <span className={`filter-btn ${weekScope === 'mine' ? 'active' : ''}`} onClick={() => setWeekScope('mine')}>ของฉัน</span>
                  <span className={`filter-btn ${weekScope === 'team' ? 'active' : ''}`} onClick={() => setWeekScope('team')}>ทั้งทีม</span>
                </div>
              )}
            </>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => openAddFor(selectedDate)}>＋ บันทึกเวลา</button>
      </div>

      {viewMode === 'calendar' && (
        <>
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
                  {p.name}
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
        ) : (() => {
          // Group entries by member
          const grouped = {};
          selectedEntries.forEach(e => {
            if (!grouped[e.userId]) grouped[e.userId] = [];
            grouped[e.userId].push(e);
          });
          return (
            <div className="ts-member-cards">
              {Object.entries(grouped).map(([userId, entries]) => {
                const profile = profileMap[userId];
                const name = shortName(profile?.email || entries[0]?.userEmail);
                const isOwner = userId === currentUserId;
                return (
                  <div key={userId} className="ts-member-card">
                    <div className="ts-member-card-header" style={{ color: isOwner ? 'var(--accent)' : 'var(--text)' }}>
                      {name} {isOwner && <span style={{ fontSize: 11, opacity: 0.7 }}>(ฉัน)</span>}
                    </div>
                    <div className="ts-member-card-body">
                      {entries.map(e => {
                        const project = (data.projects || []).find(p => p.id === e.projectId);
                        return (
                          <div key={e.id} className="ts-member-entry" style={{ cursor: 'pointer' }} onClick={() => openEntry(e)}>
                            {e.entryType === 'leave' ? (
                              <div className="ts-entry-line">{e.leaveType}{e.reason ? ` — ${e.reason}` : ''}</div>
                            ) : (
                              <div className="ts-entry-line">
                                {e.timeIn || '-'} – {e.timeOut || '-'} {project ? project.name : 'Non-Project'}{e.workDetail ? ` ${e.workDetail}` : ''}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
        </>
      )}

      {viewMode === 'weekly' && (
        <div className="ts-weekly">
          <div className="ts-weekly-header">
            <div className="ts-weekly-time-col"></div>
            {weekDays.map(d => (
              <div key={d.iso} className={`ts-weekly-day-col ${d.iso === todayISO() ? 'today' : ''}`}>
                <div className="ts-weekly-day-name">{WEEKDAYS[d.date.getDay()]}</div>
                <div className="ts-weekly-day-date">{d.date.getDate()}</div>
              </div>
            ))}
          </div>
          <div className="ts-weekly-body">
            {HOURS.map(h => (
              <div key={h} className="ts-weekly-hour-row">
                <div className="ts-weekly-hour-label">{String(h).padStart(2,'0')}:00</div>
                {weekDays.map(d => {
                  // All entries for this day to calculate overlap columns
                  const dayEntries = weekEntries.filter(e =>
                    e.date === d.iso && e.entryType !== 'leave' && e.timeIn && e.timeOut
                  );
                  const sorted = [...dayEntries].sort((a, b) => timeToMinutes(a.timeIn) - timeToMinutes(b.timeIn));
                  const cols = [];
                  const layoutMap = new Map();
                  sorted.forEach(e => {
                    const start = timeToMinutes(e.timeIn);
                    const end = timeToMinutes(e.timeOut);
                    let placed = false;
                    for (let c = 0; c < cols.length; c++) {
                      if (cols[c] <= start) { cols[c] = end; layoutMap.set(e.id, c); placed = true; break; }
                    }
                    if (!placed) { layoutMap.set(e.id, cols.length); cols.push(end); }
                  });
                  const totalCols = Math.max(cols.length, 1);
                  const cellEntries = dayEntries.filter(e => Math.floor(timeToMinutes(e.timeIn) / 60) === h);

                  return (
                    <div key={d.iso} className="ts-weekly-cell" onClick={() => {
                      setSelectedDate(d.iso);
                      setEditEntry({ _presetTime: true, timeIn: `${String(h).padStart(2,'0')}:00`, timeOut: `${String(h+1).padStart(2,'0')}:00` });
                      setViewOnly(false); setModalOpen(true);
                    }}>
                      {cellEntries.map(e => {
                        const startMin = timeToMinutes(e.timeIn);
                        const endMin = timeToMinutes(e.timeOut);
                        const topPx = ((startMin - h * 60) / 60) * 80;
                        const heightPx = Math.max(((endMin - startMin) / 60) * 80, 28);
                        const project = (data.projects || []).find(p => p.id === e.projectId);
                        const profile = profileMap[e.userId];
                        const ownerName = weekScope === 'team' ? shortName(profile?.email || e.userEmail) : '';
                        const blockColor = project?.color || '#64748b';
                        const col = layoutMap.get(e.id) || 0;
                        const wPct = 100 / totalCols;
                        const lPct = col * wPct;
                        return (
                          <div key={e.id} className="ts-weekly-block" style={{
                            top: topPx, height: heightPx,
                            left: `${lPct}%`, width: `calc(${wPct}% - 2px)`,
                            borderLeftColor: blockColor, background: `${blockColor}22`,
                          }} onClick={(ev) => { ev.stopPropagation(); openEntry(e); }}
                            title={`${ownerName} ${e.timeIn}–${e.timeOut} ${project?.name || 'Non-Project'} ${e.workDetail || ''}`}>
                            {ownerName && <div className="ts-block-owner">{ownerName}</div>}
                            <div className="ts-block-project" style={{ color: blockColor }}>{project?.name || 'Non-Project'}</div>
                            {e.workDetail && <div className="ts-block-detail">{e.workDetail}</div>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <TimesheetModal open={modalOpen} onClose={() => setModalOpen(false)} entry={editEntry?._presetTime ? null : editEntry} presetDate={selectedDate} viewOnly={viewOnly} presetTime={editEntry?._presetTime ? editEntry : null} />
    </div>
  );
}
