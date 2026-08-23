'use client';
import Modal from './Modal';
import { useStore } from '../lib/StoreContext';

export default function ConfirmModal() {
  const { confirmState, setConfirmState } = useStore();
  const open = !!confirmState;

  function close() { setConfirmState(null); }
  async function ok() {
    const fn = confirmState?.onOk;
    close();
    await fn?.();
  }

  return (
    <Modal open={open} onClose={close}>
      <div className="modal-title">{confirmState?.title || 'ยืนยันการลบ'}</div>
      <div className="confirm-body" style={{ marginBottom: 20 }}>{confirmState?.body}</div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={close}>ยกเลิก</button>
        <button className="btn btn-danger" onClick={ok}>ลบ</button>
      </div>
    </Modal>
  );
}
