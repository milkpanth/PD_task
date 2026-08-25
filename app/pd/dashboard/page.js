'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../../../lib/StoreContext';
import DataGate from '../../../components/DataGate';

const MONTH_NAMES = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const WORK_DAY_HOURS = 8;
// Dashboard headcount/KPIs are scoped to the PD team itself — not every
// role that merely has access to the PD Task section (e.g. Super Admin, CTO).
const PD_HEADCOUNT_ROLES = ['PD Manager', 'PD Team'];

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
    // "PD" headcount = only PD Manager / PD Team accounts (excludes Super Admin, CTO, etc.
    // even though those roles can also access this section).
    const pdEmployees = (data.profiles || []).filter(p => PD_HEADCOUNT_ROLES.includes(p.role));
    const pdEmployeeIds = new Set(pdEmployees.map(p => p.id));

    // All KPIs on this dashboard reflect PD Manager / PD Team only.
    const monthEntries = (data.timesheets || []).filter(t =>
      t.date && t.date.slice(0, 7) === monthKey && t.userId && pdEmployeeIds.has(t.userId)
    );

    const workEntries = monthEntries.filter(t => t.entryType !== 'leave');
    const leaveEntries = monthEntries.filter(t => t.entryType === 'leave');

    const totalWorkingHrs = workEntries.reduce((s, t) => s + hoursBetween(t.timeIn, t.timeOut), 0);
    const projectHrs = workEntries.filter(t => t.projectId).reduce((s, t) => s + hoursBetween(t.timeIn, t.timeOut), 0);
    const nonProjectHrs = totalWorkingHrs - projectHrs;
    const leaveHrs = leaveEntries.length * WORK_DAY_HOURS;

    const employeesWithEntries = new Set(monthEntries.map(t => t.userId));
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

    // Per-project hours breakdown
    const projectHrsMap = {};
    workEntries.filter(t => t.projectId).forEach(t => {
      const hrs = hoursBetween(t.timeIn, t.timeOut);
      projectHrsMap[t.projectId] = (projectHrsMap[t.projectId] || 0) + hrs;
    });
    const perProject = Object.entries(projectHrsMap)
      .map(([projectId, hrs]) => ({ projectId, hrs, pct: totalWorkingHrs > 0 ? (hrs / totalWorkingHrs) * 100 : 0 }))
      .sort((a, b) => b.hrs - a.hrs);

    return {
      totalEmployees, totalWorkingHrs, projectHrs, nonProjectHrs, projectAllocation,
      utilization, leaveHrs, missingTimesheet, pdEmployeeCount: pdEmployees.length,
      elapsedWorkingDaysCount: elapsedWorkingDays.length, perEmployee, perProject,
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

      {kpi.perProject.length > 0 && (
        <>
          <div className="dash-section-title">เวลาที่ใช้แต่ละ Project — {MONTH_NAMES[view.month]} {view.year + 543}</div>
          <div className="donut-section">
            <div className="donut-chart-wrap">
              <svg viewBox="0 0 36 36" className="donut-svg">
                {(() => {
                  const COLORS = ['#06b6d4','#f59e0b','#10b981','#8b5cf6','#ef4444','#ec4899','#6366f1','#14b8a6'];
                  let offset = 0;
                  const nonProjectPct = kpi.totalWorkingHrs > 0 ? (kpi.nonProjectHrs / kpi.totalWorkingHrs) * 100 : 0;
                  const slices = [...kpi.perProject.map((p, i) => ({ ...p, color: COLORS[i % COLORS.length] }))];
                  if (nonProjectPct > 0) slices.push({ projectId: '__non', pct: nonProjectPct, hrs: kpi.nonProjectHrs, color: '#64748b' });
                  return slices.map((s, i) => {
                    const dash = `${s.pct} ${100 - s.pct}`;
                    const el = <circle key={i} cx="18" cy="18" r="15.9155" fill="none" stroke={s.color} strokeWidth="3.5" strokeDasharray={dash} strokeDashoffset={-offset} />;
                    offset += s.pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="donut-center">
                <div className="donut-center-value">{fmtHrs(kpi.totalWorkingHrs)}</div>
                <div className="donut-center-label">ชม. รวม</div>
              </div>
            </div>
            <div className="donut-legend">
              {(() => {
                const COLORS = ['#06b6d4','#f59e0b','#10b981','#8b5cf6','#ef4444','#ec4899','#6366f1','#14b8a6'];
                const items = kpi.perProject.map((p, i) => {
                  const proj = (data.projects || []).find(x => x.id === p.projectId);
                  return { name: proj ? proj.name : p.projectId, hrs: p.hrs, pct: p.pct, color: COLORS[i % COLORS.length] };
                });
                const nonProjectPct = kpi.totalWorkingHrs > 0 ? (kpi.nonProjectHrs / kpi.totalWorkingHrs) * 100 : 0;
                if (kpi.nonProjectHrs > 0) items.push({ name: 'Non-Project', hrs: kpi.nonProjectHrs, pct: nonProjectPct, color: '#64748b' });
                return items.map((it, i) => (
                  <div key={i} className="donut-legend-item">
                    <span className="donut-legend-dot" style={{ background: it.color }} />
                    <span className="donut-legend-name">{it.name}</span>
                    <span className="donut-legend-val">{fmtHrs(it.hrs)} ชม. ({fmtPct(it.pct)}%)</span>
                  </div>
                ));
              })()}
            </div>
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
