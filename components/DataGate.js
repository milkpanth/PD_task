'use client';
import { useStore } from '../lib/StoreContext';
import { supabaseReady } from '../lib/supabaseClient';

export default function DataGate({ children }) {
  const { loading, error } = useStore();

  if (!supabaseReady) {
    return (
      <div className="content">
        <div style={{ padding: 40, maxWidth: 560 }}>
          <div className="empty-state">
            <div className="emoji">🔌</div>
            <p style={{ marginBottom: 8 }}>ยังไม่ได้เชื่อมต่อ Supabase</p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
              คัดลอก <code>.env.local.example</code> เป็น <code>.env.local</code> แล้วใส่ค่า
              NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY จากโปรเจกต์ Supabase ของคุณ
              (Project Settings → API) จากนั้นรัน SQL ใน <code>supabase/schema.sql</code> แล้ว restart dev server
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div style={{ padding: 40 }}>
          <div className="empty-state"><div className="emoji">⚠️</div><p>โหลดข้อมูลไม่สำเร็จ: {error}</p></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="content">
        <div style={{ padding: 40, color: 'var(--text3)', fontSize: 13 }}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return children;
}
