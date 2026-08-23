'use client';
import { useMemo, useState } from 'react';

const MN = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const DN = ['อา','จ','อ','พ','พฤ','ศ','ส'];

export default function MiniCalendar({ tasks }) {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());

  const taskDays = useMemo(() => {
    const set = new Set();
    (tasks || []).forEach(t => {
      if (!t.due) return;
      const d = new Date(t.due);
      if (d.getFullYear() === y && d.getMonth() === m) set.add(d.getDate());
    });
    return set;
  }, [tasks, y, m]);

  function prev() { if (m === 0) { setM(11); setY(y - 1); } else setM(m - 1); }
  function next() { if (m === 11) { setM(0); setY(y + 1); } else setM(m + 1); }

  const firstDay = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const td = new Date();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push(<div key={`p${i}`} className="mini-cal-day other-month">{prevDays - i}</div>);
  for (let d = 1; d <= days; d++) {
    const isToday = d === td.getDate() && m === td.getMonth() && y === td.getFullYear();
    cells.push(
      <div key={d} className={`mini-cal-day ${isToday ? 'today' : ''} ${taskDays.has(d) && !isToday ? 'has-task' : ''}`}>{d}</div>
    );
  }

  return (
    <div>
      <div className="mini-cal-header">
        <button className="mini-cal-nav" onClick={prev}>‹</button>
        <span className="mini-cal-month">{MN[m]} {y}</span>
        <button className="mini-cal-nav" onClick={next}>›</button>
      </div>
      <div className="mini-cal-grid">
        {DN.map(d => <div key={d} className="mini-cal-day-name">{d}</div>)}
        {cells}
      </div>
    </div>
  );
}
