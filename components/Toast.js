'use client';
import { useStore } from '../lib/StoreContext';

export default function Toast() {
  const { toastMsg } = useStore();
  return (
    <div className="toast" style={{ display: toastMsg ? 'block' : 'none' }}>{toastMsg}</div>
  );
}
