import { useEffect, useState } from 'react';
import api, { inr, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

export default function Inventory() {
  const { page, setPage, search, setSearch } = useListState();
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: 1, note: '' });

  async function load() {
    const { data } = await api.get('/inventory', { params: { filter, page, limit: 15, search: search || undefined } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [filter, page, search]);

  async function openAdjust() {
    const { data } = await api.get('/products', { params: { limit: 100 } });
    setAllProducts(data.data);
    setForm({ productId: '', type: 'IN', quantity: 1, note: '' });
    setOpen(true);
  }

  async function adjust() {
    await api.post('/inventory/adjust', { ...form, quantity: Number(form.quantity) });
    setOpen(false);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search product / SKU" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="select" value={filter} onChange={(e) => { setPage(1); setFilter(e.target.value); }}>
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          {meta?.stockValue != null && <span style={{ color: 'var(--muted)' }}>Page stock value: {inr(meta.stockValue)}</span>}
        </div>
        <button className="btn btn-primary" onClick={openAdjust}>Adjust Stock</button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Low At</th><th>Value</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td><td>{p.sku}</td><td>{p.stock}</td><td>{p.lowStockAt}</td>
                <td>{inr(p.stock * (p.costPrice || p.price))}</td>
                <td><span className={`badge ${statusBadge(p.status)}`}>{p.status.replaceAll('_', ' ')}</span></td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    setAllProducts([p, ...allProducts.filter((x) => x.id !== p.id)]);
                    setForm({ productId: p.id, type: 'IN', quantity: 1, note: '' });
                    setOpen(true);
                  }}>Adjust</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title="Adjust Inventory" onClose={() => setOpen(false)} onSubmit={adjust}>
        <div className="form-group">
          <label>Product</label>
          <select className="select" style={{ width: '100%' }} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            <option value="">Select</option>
            {(allProducts.length ? allProducts : rows).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Type</label>
          <select className="select" style={{ width: '100%' }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="SET">Set Absolute</option>
          </select>
        </div>
        <div className="form-group"><label>Quantity</label><input className="input" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
        <div className="form-group"><label>Note</label><input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
      </Modal>
    </div>
  );
}
