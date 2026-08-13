import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { fmtDay, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const empty = { productId: '', customerName: '', serialNo: '', months: 6, notes: '', status: 'ACTIVE' };

export default function Warranties() {
  const { search, setSearch, status, setStatus, page, setPage } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function load() {
    const { data } = await api.get('/warranties', { params: { search, status, page, limit: 15 } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [search, status, page]);

  async function openCreate() {
    const { data } = await api.get('/products', { params: { limit: 100, status: 'PUBLISHED' } });
    setProducts(data.data);
    setEditId(null);
    setForm(empty);
    setOpen(true);
  }

  async function openEdit(w) {
    const { data } = await api.get('/products', { params: { limit: 100 } });
    setProducts(data.data);
    setEditId(w.id);
    setForm({
      productId: w.productId,
      customerName: w.customerName || '',
      serialNo: w.serialNo || '',
      months: 6,
      notes: w.notes || '',
      status: w.status,
    });
    setOpen(true);
  }

  async function save() {
    if (editId) {
      await api.patch(`/warranties/${editId}`, {
        customerName: form.customerName,
        serialNo: form.serialNo,
        notes: form.notes,
        status: form.status,
        productId: form.productId,
      });
    } else {
      await api.post('/warranties', {
        productId: form.productId,
        customerName: form.customerName,
        serialNo: form.serialNo,
        months: Number(form.months),
        notes: form.notes,
      });
    }
    setOpen(false);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this warranty?')) return;
    await api.delete(`/warranties/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search warranty / serial / customer" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CLAIMED">Claimed</option>
            <option value="VOID">Void</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Warranty</button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Warranty No</th><th>Product</th><th>Customer</th><th>Serial</th><th>Ends</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td>{w.warrantyNo}</td>
                <td>{w.product?.name}</td>
                <td>{w.customerName || '—'}</td>
                <td>{w.serialNo || '—'}</td>
                <td>{fmtDay(w.endDate)}</td>
                <td><span className={`badge ${statusBadge(w.status)}`}>{w.status}</span></td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(w)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => api.patch(`/warranties/${w.id}`, { status: 'CLAIMED' }).then(load)}>Claim</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(w.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title={editId ? 'Edit Warranty' : 'Add Warranty'} onClose={() => setOpen(false)} onSubmit={save}>
        <div className="form-group">
          <label>Product</label>
          <select className="select" style={{ width: '100%' }} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            <option value="">Select</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Customer Name</label><input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Serial No</label><input className="input" value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} /></div>
        {!editId && (
          <div className="form-group"><label>Months</label><input className="input" type="number" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} /></div>
        )}
        {editId && (
          <div className="form-group">
            <label>Status</label>
            <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CLAIMED">Claimed</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        )}
        <div className="form-group"><label>Notes</label><textarea className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </Modal>
    </div>
  );
}
