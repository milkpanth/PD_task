'use client';
import { useStore } from '../../lib/StoreContext';
import DataGate from '../../components/DataGate';

const MN = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

export default function TimelinePage() {
  return (
    <>
      <div className="topbar"><span className="topbar-title">Roadmap</span></div>
      <div className="content">
        <DataGate><TimelineBody /></DataGate>
      </div>
    </>
  );
}

function TimelineBody() {
  const { data } = useStore();
  const { projects, tasks } = data;
  const year = new Date().getFullYear();
  const curM = new Date().getMonth();

  return (
    <div className="timeline-page">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Roadmap</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>ภาพรวม timeline ของทุก project ({year})</div>
      </div>
      <div className="timeline-container">
        {!projects.length ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="emoji">📅</div><p>ยังไม่มี project</p></div>
        ) : (
          <>
            <div className="timeline-months">
              <div className="tl-label-col">Project</div>
              <div className="tl-months-row">
                {MN.map((m, i) => <div key={m} className={`tl-month ${i === curM ? 'current' : ''}`}>{m}</div>)}
              </div>
            </div>
            {projects.map(p => {
              const s = p.start ? new Date(p.start) : null;
              const e = p.end ? new Date(p.end) : null;
              let barStyle = null;
              if (s && e) {
                const sm = Math.max(0, (s.getFullYear() - year) * 12 + s.getMonth());
                const em = Math.min(11, (e.getFullYear() - year) * 12 + e.getMonth());
                if (sm <= 11 && em >= 0) {
                  const l = (Math.max(0, sm) / 12) * 100;
                  const w = ((Math.min(11, em) - Math.max(0, sm) + 1) / 12) * 100;
                  barStyle = { left: `${l}%`, width: `${w}%`, background: p.color + 'cc' };
                }
              }
              const pt = tasks.filter(t => t.project === p.id);
              const pd = pt.filter(t => t.done).length;
              const pct = pt.length > 0 ? Math.round(pd / pt.length * 100) : 0;
              return (
                <div key={p.id} className="timeline-row">
                  <div className="tl-proj-name">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <div>
                      <div>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>{pct}% เสร็จ</div>
                    </div>
                  </div>
                  <div className="tl-gantt">
                    <div className="tl-grid-lines">{MN.map((m) => <div key={m} className="tl-grid-line" />)}</div>
                    {barStyle && <div className="tl-bar" style={barStyle}>{p.name} {pct}%</div>}
                    {year === new Date().getFullYear() && (
                      <div className="tl-current-line" style={{ left: `${((curM + new Date().getDate() / 31) / 12) * 100}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
