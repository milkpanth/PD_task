'use client';
import { useStore } from '../../../lib/StoreContext';
import DataGate from '../../../components/DataGate';
import GenericTable from '../../../components/GenericTable';
import { SCHEMAS } from '../../../lib/schemas';

const TYPE = 'pdtask';

export default function Page() {
  const { openGenericAdd, data } = useStore();
  const schema = SCHEMAS[TYPE];
  const count = (data[schema.table] || []).length;

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">PD Task · Task List</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => openGenericAdd(TYPE)}>＋ Task ใหม่</button>
        </div>
      </div>
      <div className="content">
        <DataGate>
          <div className="project-page">
            <div className="proj-toolbar">
              <span className="proj-toolbar-title">รายการ {schema.label} ทั้งหมด ({count}) — No. running อัตโนมัติ</span>
            </div>
            <div className="devtask-scroll"><GenericTable type={TYPE} /></div>
          </div>
        </DataGate>
      </div>
    </>
  );
}
