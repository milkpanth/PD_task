'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../../../lib/StoreContext';
import { useAuth } from '../../../lib/AuthContext';
import DataGate from '../../../components/DataGate';
import TimesheetCalendar from '../../../components/TimesheetCalendar';
import TimesheetModal from '../../../components/TimesheetModal';
import { LEAVE_TYPE_LABEL_TH } from '../../../lib/schemas';

const MONTH_NAMES = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export default function Page() {
  const { data, addRow, updateRow, deleteRow, confirm } = useStore();
  const { perms } = useAuth();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [modalState, setModalState] = useState(null); // { row: null|object, presetDate }

  const entries = data.timesheets || [];
  const projects = data.projects || [];
  const projectName = (id) => projects.find(p => p.id === id)?.name || '—';

  const dayEntries = useMemo(
    () => entries
      .filter(e => e.date === selectedDate)
      .sort((a, b) => (a.timeIn || '').localeCompare(b.timeIn || '')),
    [entries, selectedDate]
  );

  function navigate(delta) {
    if (delta === 0) {
      const t = new Date();
      setYear(t.getFullYear());
      setMonth(t.getMonth());
      setSelectedDate(todayStr());
      return;
    }
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; } else if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  function openAdd(dateStr) { setModalState({ row: null, presetDate: dateStr || selectedDate }); }
  function openEdit(row) { setModalState({ row, presetDate: row.date }); }
  function closeModal() { setModalState(null); }

  async function handleSave(values) {
    if (modalState.row) await updateRow('timesheets', modalState.row.id, values);
    else await addRow('timesheets', values);
    setModalState(null);
  }

  function handleDelete(id) {
    confirm('ลบรายการนี้?', 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('timesheets', id);
      setModalState(null);
    });
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">PD Task · Timesheet</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => openAdd(selectedDate)}>＋ บันทึกเวลา</button>
        </div>
      </div>
      <div className="content">
        <DataGate>
          <div className="project-page">
            <TimesheetCalendar
              year={year}
              month={month}
              entries={entries}
              selectedDate={selectedDate}
              onNavigate={navigate}
              onSelectDay={setSelectedDate}
            />

            <div className="ts-day-panel">
              <div className="ts-day-panel-header">
                <span className="ts-day-panel-title">{formatThaiDate(selectedDate)}</span>
                <button className="btn btn-ghost ts-day-add-btn" onClick={() => openAdd(selectedDate)}>＋ เพิ่มรายการ</button>
              </div>

              {dayEntries.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>ยังไม่มีรายการในวันนี้</div>
              ) : (
                <div className="ts-day-list">
                  {dayEntries.map(e => (
                    <div key={e.id} className="ts-day-item" onClick={() => openEdit(e)}>
                      {e.entryType === 'leave' ? (
                        <>
                          <span className={`ts-pill ${e.leaveType === 'Sick Leave' ? 'ts-pill-sick' : e.leaveType === 'Personal Leave' ? 'ts-pill-personal' : 'ts-pill-annual'}`}>
                            {LEAVE_TYPE_LABEL_TH[e.leaveType] || e.leaveType}
                          </span>
                          <span className="ts-day-item-detail">{e.leaveReason}</span>
                        </>
                      ) : (
                        <>
                          <span className="ts-pill ts-pill-attend">
                            {(e.timeIn || '—').slice(0, 5)}–{(e.timeOut || '—').slice(0, 5)}
                          </span>
                          <span className="ts-day-item-detail">
                            {projectName(e.projectId)}{e.workDetail ? ` · ${e.workDetail}` : ''}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DataGate>
      </div>

      <TimesheetModal
        open={!!modalState}
        row={modalState?.row}
        presetDate={modalState?.presetDate}
        projects={projects}
        canDelete={perms.canDelete}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
