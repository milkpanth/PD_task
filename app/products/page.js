'use client';
import { useMemo, useState } from 'react';
import { useStore } from '../../lib/StoreContext';
import { useAuth } from '../../lib/AuthContext';
import DataGate from '../../components/DataGate';
import ProductModal from '../../components/ProductModal';

const PROD_STATUS_LBL = { planning: 'Planning', requirement: 'Requirement', development: 'Development', test: 'Test', deliver: 'Deliver', done: 'Done' };
const PROD_STATUS_CLS = { planning: 'status-planning', requirement: 'status-requirement', development: 'status-development', test: 'status-teststatus', deliver: 'status-deliver', done: 'status-donestatus' };

export default function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  function openAdd() { setEditProduct(null); setModalOpen(true); }
  function openEdit(p) { setEditProduct(p); setModalOpen(true); }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Product</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openAdd}>＋ Product ใหม่</button>
        </div>
      </div>
      <div className="content">
        <DataGate><ProductsBody onEdit={openEdit} /></DataGate>
      </div>
      <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} product={editProduct} />
    </>
  );
}

function ProductsBody({ onEdit }) {
  const { data, confirm, deleteRow, toast } = useStore();
  const { perms } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const products = useMemo(() => {
    let list = [...data.products];
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s) || (p.phase || '').toLowerCase().includes(s));
    }
    return list;
  }, [data.products, statusFilter, search]);

  function del(p) {
    confirm(`ลบ Product "${p.name}"?`, 'การลบจะไม่สามารถกู้คืนได้', async () => {
      await deleteRow('products', p.id);
      toast('🗑️ ลบ product แล้ว');
    });
  }

  const statuses = ['all', ...Object.keys(PROD_STATUS_LBL)];

  return (
    <div className="products-page">
      <div className="products-toolbar">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>◉ Products</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>จัดการสินค้า / บริการของคุณ</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="search-input" placeholder="🔍  ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
        </div>
      </div>
      <div className="category-bar">
        {statuses.map(c => {
          const count = c === 'all' ? data.products.length : data.products.filter(p => p.status === c).length;
          const lbl = c === 'all' ? 'ทั้งหมด' : PROD_STATUS_LBL[c];
          return (
            <div key={c} className={`cat-btn ${c === statusFilter ? 'active' : ''}`} onClick={() => setStatusFilter(c)}>{lbl} ({count})</div>
          );
        })}
      </div>
      <div className="products-grid">
        {!products.length && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="emoji">📦</div><p>ยังไม่มี Product</p></div>
        )}
        {products.map(p => {
          const stLbl = PROD_STATUS_LBL[p.status] || 'Planning';
          const stCls = PROD_STATUS_CLS[p.status] || 'status-planning';
          const scopeLbl = p.scope === 'external' ? 'External' : 'Internal';
          const scopeCls = p.scope === 'external' ? 'scope-external' : 'scope-internal';
          return (
            <div key={p.id} className="product-card">
              <div className="product-card-img">{p.emoji || '📦'}<div className="product-card-img-overlay" /></div>
              <div className="product-card-actions">
                <button className="prod-action-btn" onClick={() => onEdit(p)}>✎</button>
                {perms.canDelete && <button className="prod-action-btn del" onClick={() => del(p)}>🗑</button>}
              </div>
              <div className="product-card-body">
                <div className="product-card-top">
                  <div className="product-card-name">{p.name}</div>
                  {p.phase && <span className="product-phase-tag">{p.phase}</span>}
                </div>
                {p.sku && <div className="product-card-sku">{p.sku}</div>}
                <div className="product-card-desc">{p.desc || 'ไม่มีรายละเอียด'}</div>
                <div className="product-card-footer">
                  <span className={`product-scope-tag ${scopeCls}`}>{scopeLbl}</span>
                  <span className={`product-status-badge ${stCls}`}>{stLbl}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
