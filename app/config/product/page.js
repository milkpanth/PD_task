'use client';
import { useStore } from '../../../lib/StoreContext';
import { useAuth } from '../../../lib/AuthContext';
import DataGate from '../../../components/DataGate';
import GenericTable from '../../../components/GenericTable';
import { SCHEMAS } from '../../../lib/schemas';

const TYPE = 'productmaster';

export default function Page() {
  const { openGenericAdd, data } = useStore();
  const { perms } = useAuth();
  const schema = SCHEMAS[TYPE];
  const count = (data[schema.table] || []).length;

  if (!perms.canAccessConfig) {
    return (
      <>
        <div className="topbar"><span className="topbar-title">Config · Product Master</span></div>
        <div className="content">
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="emoji">🔒</div><p>คุณไม่ได้รับสิทธิ์เข้าถึงส่วนนี้</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Config · Product Master</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => openGenericAdd(TYPE)}>＋ Product ใหม่</button>
        </div>
      </div>
      <div className="content">
        <DataGate>
          <div className="project-page">
            <div className="proj-toolbar">
              <span className="proj-toolbar-title">รายการ {schema.label} ทั้งหมด ({count})</span>
            </div>
            <div className="devtask-scroll"><GenericTable type={TYPE} /></div>
          </div>
        </DataGate>
      </div>
    </>
  );
}
