'use client';
import { useMemo } from 'react';
import { LEAVE_TYPE_LABEL_TH } from '../lib/schemas';

const MONTH_NAMES = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const DAY_NAMES = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function leavePillClass(leaveType) {
  if (leaveType === 'Sick Leave') return 'ts-pill-sick';
  if (leaveType === 'Personal Leave') return 'ts-pill-personal';
  return 'ts-pill-annual';
}

function pillLabel(entry) {
  if (entry.entryType === 'leave') return LEAVE_TYPE_LABEL_TH[entry.leaveType] || entry.leaveType || 'ลา';
  const timeIn = (entry.timeIn || '').slice(0, 5);
  const timeOut = (entry.timeOut || '').slice(0, 5);
  if (!timeIn && !timeOut) return 'เข้างาน';
  return `${timeIn || '—'}–${timeOut || '—'}`;
}

export default function TimesheetCalendar({ year, month, entries, selectedDate, onNavigate, onSelectDay }) {
  const entriesByDate = useMemo(() => {
    const map = {};
    (entries || []).forEach(e => {
      if (!e.date) return;
      (map[e.date] || (map[e.date] = [])).push(e);
    });
    return map;
  }, [entries]);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const cells = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ key: `p${i}`, day: prevMonthDays - i, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: `d${d}`, day: d, other: false, dateStr: toDateStr(year, month, d) });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ key: `n${nextDay}`, day: nextDay, other: true });
    nextDay += 1;
  }

  return (
    <div className="ts-calendar">
      <div className="ts-cal-header">
        <span className="ts-cal-title">{MONTH_NAMES[month]} {year}</span>
        <div className="ts-cal-nav">
          <button className="btn btn-ghost ts-cal-nav-btn" onClick={() => onNavigate(-1)} aria-label="เดือนก่อนหน้า">‹</button>
          <button className="btn btn-ghost ts-cal-today-btn" onClick={() => onNavigate(0)}>วันนี้</button>
          <button className="btn btn-ghost ts-cal-nav-btn" onClick={() => onNavigate(1)} aria-label="เดือนถัดไป">›</button>
        </div>
      </div>

      <div className="ts-cal-grid ts-cal-grid-head">
        {DAY_NAMES.map(d => <div key={d} className="ts-cal-day-name">{d}</div>)}
      </div>

      <div className="ts-cal-grid">
        {cells.map(c => {
          const dayEntries = !c.other && entriesByDate[c.dateStr] ? entriesByDate[c.dateStr] : [];
          const isToday = !c.other && c.dateStr === todayStr;
          const isSelected = !c.other && c.dateStr === selectedDate;
          return (
            <div
              key={c.key}
              className={`ts-cal-cell ${c.other ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => !c.other && onSelectDay(c.dateStr)}
            >
              <span className="ts-cal-daynum">{c.day}</span>
              {dayEntries.length > 0 && (
                <div className="ts-cal-pills">
                  {dayEntries.slice(0, 2).map(e => (
                    <span key={e.id} className={`ts-pill ${e.entryType === 'leave' ? leavePillClass(e.leaveType) : 'ts-pill-attend'}`}>
                      {pillLabel(e)}
                    </span>
                  ))}
                  {dayEntries.length > 2 && <span className="ts-pill ts-pill-more">+{dayEntries.length - 2}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
