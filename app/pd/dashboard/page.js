'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../../../lib/StoreContext';
import { ROLE_CONFIG } from '../../../lib/AuthContext';
import DataGate from '../../../components/DataGate';

const MONTH_NAMES = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const WORK_DAY_HOURS = 8;

function toISO(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function todayISO() { return toISO(new Date()); }

// Decimal hours between two "HH:MM" strings. Guards against blanks and an
// overnight shift (timeOut earlier than timeIn) by wrapping to the next day.
function hoursBetween(timeIn, timeOut) {
  if (!timeIn || !timeOut) return 0;
  const [ih, im] = timeIn.split(':').map(Number);
  const [oh, om] = timeOut.split(':').map(Number);
  if ([ih, im, oh, om].some(n => Number.isNaN(n))) return 0;
  let mins = (oh * 60 + om) - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

// All Mon–Fri ISO dates in a given month.
function workingDaysInMonth(year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const out = [];
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(year, month, d);
    const wd = dt.getDay();
    if (wd !== 0 && wd !== 6) out.push(toISO(dt));
  }
  return out;
}

function fmtHrs(n) {
  return (Math.round(n * 10) / 10).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}
function fmtPct(n) {
  return (Math.round(n * 10) / 10).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

export default function PdDashboardPage() {
  return (
    <>
      <div className="topbar"><span className="topbar-title">PD Task · Dashboard</span></div>
      <div className="content"><DataGate><Body /></DataGate></div>
    </>
  );
}

function Body() {
  const { data } = useStore();
  const { pdTasks, pdIssues, pdBacklog, pdFeedback } = data;
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  function prevMonth() { setView(v => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 })); }
  function nextMonth() { setView(v => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 })); }
  function goToday() { setView({ year: today.getFullYear(), month: today.getMonth() }); }

  const kpi = useMemo(() => {
    const { year, month } = view;
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthEntries = (data.timesheets || []).filter(t => t.date && t.date.slice(0, 7) === monthKey);

    // "PD" headcount = accounts whose role can access the PD Task section.
    const pdEmployees = (data.profiles || []).filter(p => ROLE_CONFIG[p.role]?.canAccessPD);
    const pdEmployeeIds = new Set(pdEmployees.map(p => p.id));

    const workEntries = monthEntries.filter(t => t.entryType !== 'leave');
    const leaveEntries = monthEntries.filter(t => t.entryType === 'leave');

    const totalWorkingHrs = workEntries.reduce((s, t) => s + hoursBetween(t.timeIn, t.timeOut), 0);
    const projectHrs = workEntries.filter(t => t.projectId).reduce((s, t) => s + hoursBetween(t.timeIn, t.timeOut), 0);
    const nonProjectHrs = totalWorkingHrs - projectHrs;
    const leaveHrs = leaveEntries.length * WORK_DAY_HOURS;

    const employeesWithEntries = new Set(monthEntries.map(t => t.userId).filter(Boolean));
    const totalEmployees = employeesWithEntries.size;

    const projectAllocation = totalWorkingHrs > 0 ? (projectHrs / totalWorkingHrs) * 100 : 0;

    // Only count working days that have already happened, so a partial or
    // future month doesn't get penalized with an artificially low % / missing count.
    const todayIso = todayISO();
    const elapsedWorkingDays = workingDaysInMonth(year, month).filter(iso => iso <= todayIso);
    const capacityHrs = pdEmployees.length * elapsedWorkingDays.length * WORK_DAY_HOURS;
    const utilization = capacityHrs > 0 ? (totalWorkingHrs / capacityHrs) * 100 : 0;

    const loggedKeys = new Set(monthEntries.filter(t => t.userId).map(t => `${t.userId}|${t.date}`));
    let missingTimesheet = 0;
    const perEmployee = pdEmployees.map(p => {
      let missingDays = 0;
      elapsedWorkingDays.forEach(iso => { if (!loggedKeys.has(`${p.id}|${iso}`)) missingDays++; });
      missingTimesheet += missingDays;
      const mine = monthEntries.filter(t => t.userId === p.id);
      const mineWork = mine.filter(t => t.entryType !== 'leave');
      const w = mineWork.reduce((s, t) => s + hoursBetween(t.timeIn, t.timeOut), 0);
      const pj = mineWork.filter(t => t.projectId).reduce((s, t) => s + hoursBetween(t.timeIn, t.timeOut), 0);
      const lv = mine.filter(t => t.entryType === 'leave').length * WORK_DAY_HOURS;
      return { id: p.id, email: p.email, role: p.role, working: w, project: pj, nonProject: w - pj, leave: lv, missingDays };
    }).sort((a, b) => b.missingDays - a.missingDays || b.working - a.working);

    return {
      totalEmployees, totalWorkingHrs, projectHrs, nonProjectHrs, projectAllocation,
      utilization, leaveHrs, missingTimesheet, pdEmployeeCount: pdEmployees.length,
      elapsedWorkingDaysCount: elapsedWorkingDays.length, perEmployee,
    };
  }, [data.timesheets, data.profiles, view]);

  const total = pdTasks.length, done = pdTasks.filter(t => t.status === 'Done').length;
  const openIssues = pdIssues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();

  return (
    <div className="dashboard">
      <div className="dash-month-nav">
        <button onClick={prevMonth}>‹</button>
        <span className="dash-month-label">{MONTH_NAMES[view.month]} {view.year + 543}</span>
        <button onClick={nextMonth}>›</button>
        {!isCurrentMonth && <button className="btn btn-ghost" onClick={goToday}>เดือนนี้</button>}
      </div>

      <div className="kpi-grid">
        <div className="stat-card c1">
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">{kpi.totalEmployees}</div>
          <div className="stat-sub">มี Timesheet จาก {kpi.pdEmployeeCount} คนใน PD</div>
          <div className="stat-icon">👥</div>
        </div>
        <div className="stat-card c5">
          <div className="stat-label">Total Working Hrs.</div>
          <div className="stat-value">{fmtHrs(kpi.totalWorkingHrs)}</div>
          <div className="stat-sub">ชั่วโมงทำงานทั้งหมด</div>
          <div className="stat-icon">⏱</div>
        </div>
        <div className="stat-card c2">
          <div className="stat-label">Project Hrs.</div>
          <div className="stat-value">{fmtHrs(kpi.projectHrs)}</div>
          <div className="stat-sub">ชั่วโมงที่ลง Project</div>
          <div className="stat-icon">📁</div>
        </div>
        <div className="stat-card c6">
          <div className="stat-label">Non-Project Hrs.</div>
          <div className="stat-value">{fmtHrs(kpi.nonProjectHrs)}</div>
          <div className="stat-sub">ชั่วโมงที่ไม่ใช่ Project</div>
          <div className="stat-icon">🧩</div>
        </div>
        <div className="stat-card c4">
          <div className="stat-label">Project Allocation</div>
          <div className="stat-value">{fmtPct(kpi.projectAllocation)}%</div>
          <div className="stat-sub">% เวลาที่ใช้กับ Project</div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${Math.min(100, kpi.projectAllocation)}%`, background: 'var(--cyan)' }} /></div>
          <div className="stat-icon">📊</div>
        </div>
        <div className="stat-card c3">
          <div className="stat-label">Utilization</div>
          <div className="stat-value">{fmtPct(kpi.utilization)}%</div>
          <div className="stat-sub">% การใช้ Capacity</div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${Math.min(100, kpi.utilization)}%`, background: 'var(--yellow)' }} /></div>
          <div className="stat-icon">🎯</div>
        </div>
        <div className="stat-card c7">
          <div className="stat-label">Leave Hrs.</div>
          <div className="stat-value">{fmtHrs(kpi.leaveHrs)}</div>
          <div className="stat-sub">ชั่วโมงลา</div>
          <div className="stat-icon">🏖</div>
        </div>
        <div className="stat-card c8">
          <div className="stat-label">Missing Timesheet</div>
          <div className="stat-value">{kpi.missingTimesheet}</div>
          <div className="stat-sub">คน/วันที่ยังไม่ได้ลง (จาก {kpi.elapsedWorkingDaysCount} วันทำการ)</div>
          <div className="stat-icon">⚠️</div>
        </div>
      </div>

      {kpi.perEmployee.length > 0 && (
        <>
          <div className="dash-section-title">รายบุคคล — {MONTH_NAMES[view.month]} {view.year + 543}</div>
          <div className="devtask-scroll" style={{ marginBottom: 24 }}>
            <table className="devtask-table">
              <thead>
                <tr>
                  <th>พนักงาน</th>
                  <th>Role</th>
                  <th>Working Hrs.</th>
                  <th>Project Hrs.</th>
                  <th>Non-Project Hrs.</th>
                  <th>Leave Hrs.</th>
                  <th>Missing (วัน)</th>
                </tr>
              </thead>
              <tbody>
                {kpi.perEmployee.map(e => (
                  <tr key={e.id}>
                    <td>{e.email}</td>
                    <td>{e.role}</td>
                    <td>{fmtHrs(e.working)}</td>
                    <td>{fmtHrs(e.project)}</td>
                    <td>{fmtHrs(e.nonProject)}</td>
                    <td>{fmtHrs(e.leave)}</td>
                    <td>{e.missingDays > 0 ? <span className="priority-badge p-high">{e.missingDays}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="dash-section-title">PD Task Overview</div>
      <div className="stats-grid">
        <div className="stat-card c1"><div className="stat-label">PD Tasks ทั้งหมด</div><div className="stat-value">{total}</div><div className="stat-sub">{done} เสร็จแล้ว</div><div className="stat-icon">🗂️</div></div>
        <div className="stat-card c4"><div className="stat-label">Issue เปิดอยู่</div><div className="stat-value">{openIssues}</div><div className="stat-sub">จาก {pdIssues.length} ทั้งหมด</div><div className="stat-icon">🐞</div></div>
        <div className="stat-card c3"><div className="stat-label">Backlog</div><div className="stat-value">{pdBacklog.length}</div><div className="stat-sub">รายการรอ</div><div className="stat-icon">📥</div></div>
        <div className="stat-card c2"><div className="stat-label">Feedback</div><div className="stat-value">{pdFeedback.length}</div><div className="stat-sub">ทั้งหมด</div><div className="stat-icon">💬</div></div>
      </div>
    </div>
  );
}
