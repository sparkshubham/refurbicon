import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { inr, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const empty = {
  name: '', sku: '', price: '', costPrice: '', stock: 0, condition: 'Refurbished Grade A',
  warrantyMonths: 6, status: 'PUBLISHED', brandName: '', categoryName: '',
  specifications: { Processor: '', RAM: '', Storage: '', OS: '' },
};

export default function Products() {
  const { search, setSearch, status, setStatus, page, setPage } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function load() {
    const { data } = await api.get('/products', { params: { search, status, page, limit: 10 } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [search, status, page]);

  async function save() {
    const payload = {
      ...form,
      price: Number(form.price),
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      stock: Number(form.stock || 0),
      warrantyMonths: Number(form.warrantyMonths || 6),
    };
    if (editId) await api.put(`/products/${editId}`, payload);
    else await api.post('/products', payload);
    setOpen(false);
    setForm(empty);
    setEditId(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search products / SKU" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Image</th><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td><img className="thumb" src={p.images?.[0] || 'https://placehold.co/80x80?text=P'} alt="" /></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.brand?.name} · {p.category?.name}</div>
                </td>
                <td>{p.sku}</td>
                <td>{inr(p.price)}</td>
                <td>{p.stock}</td>
                <td><span className={`badge ${statusBadge(p.status)}`}>{p.status.replaceAll('_', ' ')}</span></td>
                <td>
                  <div className="row-actions">
                    <Link className="btn btn-ghost btn-sm" to={`/products/${p.id}`}><Eye size={14} /></Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(p.id); setForm({ ...empty, ...p, brandName: p.brand?.name || '', categoryName: p.category?.name || '' }); setOpen(true); }}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="empty">No products found</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />

      <Modal open={open} title={editId ? 'Edit Product' : 'Add Product'} onClose={() => setOpen(false)} onSubmit={save}>
        <div className="form-group"><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-group"><label>SKU</label><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group"><label>Price</label><input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="form-group"><label>Stock</label><input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group"><label>Brand</label><input className="input" value={form.brandName || ''} onChange={(e) => setForm({ ...form, brandName: e.target.value })} /></div>
          <div className="form-group"><label>Category</label><input className="input" value={form.categoryName || ''} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} /></div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
