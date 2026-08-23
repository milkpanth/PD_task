'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { LEAVE_TYPES, LEAVE_TYPE_LABEL_TH } from '../lib/schemas';

function emptyForm(presetDate) {
  return {
    date: presetDate || '',
    entryType: 'attendance',
    timeIn: '09:00',
    timeOut: '18:00',
    projectId: '',
    workDetail: '',
    leaveType: '',
    leaveReason: '',
  };
}

export default function TimesheetModal({ open, row, presetDate, projects, canDelete, onClose, onSave, onDelete }) {
  const [values, setValues] = useState(() => emptyForm(presetDate));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (row) {
      setValues({
        date: row.date || presetDate || '',
        entryType: row.entryType || 'attendance',
        timeIn: (row.timeIn || '09:00').slice(0, 5),
        timeOut: (row.timeOut || '18:00').slice(0, 5),
        projectId: row.projectId || '',
        workDetail: row.workDetail || '',
        leaveType: row.leaveType || '',
        leaveReason: row.leaveReason || '',
      });
    } else {
      setValues(emptyForm(presetDate));
    }
  }, [open, row, presetDate]);

  if (!open) return null;

  function setField(k, v) { setValues(prev => ({ ...prev, [k]: v })); }

  function validate() {
    const next = {};
    if (!values.date) next.date = 'กรุณาเลือกวันที่';
    if (values.entryType === 'attendance') {
      if (!values.projectId) next.projectId = 'กรุณาเลือก Project';
    } else {
      if (!values.leaveType) next.leaveType = 'กรุณาเลือกประเภทการลา';
      if (!values.leaveReason.trim()) next.leaveReason = 'กรุณาระบุเหตุผลในการลา';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const isLeave = values.entryType === 'leave';
    onSave({
      date: values.date,
      entryType: values.entryType,
      timeIn: isLeave ? null : (values.timeIn || null),
      timeOut: isLeave ? null : (values.timeOut || null),
      projectId: isLeave ? null : (values.projectId || null),
      workDetail: isLeave ? '' : values.workDetail,
      leaveType: isLeave ? values.leaveType : null,
      leaveReason: isLeave ? values.leaveReason : '',
    });
  }

  return (
    <Modal open={open} onClose={onClose} width="480px">
      <div className="modal-title">{row ? '✎ แก้ไข Timesheet' : '🕒 Timesheet ใหม่'}</div>

      <div className="seg-toggle">
        <div
          className={`seg-btn ${values.entryType === 'attendance' ? 'active attendance' : ''}`}
          onClick={() => setField('entryType', 'attendance')}
        >เข้างาน</div>
        <div
          className={`seg-btn ${values.entryType === 'leave' ? 'active leave' : ''}`}
          onClick={() => setField('entryType', 'leave')}
        >ลา</div>
      </div>

      <div className="form-group">
        <label className="form-label">{values.entryType === 'leave' ? 'วันที่ลา (Date)' : 'วันที่ (Date)'}</label>
        <input type="date" className="form-input" value={values.date} onChange={e => setField('date', e.target.value)} />
        {errors.date && <div className="form-error">{errors.date}</div>}
      </div>

      {values.entryType === 'attendance' ? (
        <>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">เวลาเข้างาน (Time In)</label>
              <input type="time" className="form-input" value={values.timeIn} onChange={e => setField('timeIn', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">เวลาออกงาน (Time Out)</label>
              <input type="time" className="form-input" value={values.timeOut} onChange={e => setField('timeOut', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project</label>
            <select className="form-select" value={values.projectId} onChange={e => setField('projectId', e.target.value)}>
              <option value="">— เลือก Project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.projectId && <div className="form-error">{errors.projectId}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">รายละเอียดงานที่ทำ</label>
            <textarea
              className="form-textarea"
              placeholder="เช่น ประชุมทีมออกแบบ, แก้ไข bug หน้า login"
              value={values.workDetail}
              onChange={e => setField('workDetail', e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div className="form-group">
            <label className="form-label">ประเภทการลา</label>
            <div className="ts-leave-chips">
              {LEAVE_TYPES.map(lt => (
                <div
                  key={lt}
                  className={`chip ${values.leaveType === lt ? 'selected' : ''}`}
                  onClick={() => setField('leaveType', lt)}
                >{LEAVE_TYPE_LABEL_TH[lt]}</div>
              ))}
            </div>
            {errors.leaveType && <div className="form-error">{errors.leaveType}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">เหตุผลในการลา</label>
            <textarea
              className="form-textarea"
              placeholder="ระบุเหตุผลในการลา"
              value={values.leaveReason}
              onChange={e => setField('leaveReason', e.target.value)}
            />
            {errors.leaveReason && <div className="form-error">{errors.leaveReason}</div>}
          </div>
        </>
      )}

      <div className="modal-actions-split">
        {row && canDelete ? (
          <button className="btn btn-danger" onClick={() => onDelete(row.id)}>🗑 ลบ</button>
        ) : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSave}>บันทึก</button>
        </div>
      </div>
    </Modal>
  );
}
