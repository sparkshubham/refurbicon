import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const empty = { name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', notes: '' };

export default function Customers() {
  const { search, setSearch, page, setPage } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function load() {
    const { data } = await api.get('/customers', { params: { search, page, limit: 15 } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [search, page]);

  async function save() {
    if (editId) await api.put(`/customers/${editId}`, form);
    else await api.post('/customers', form);
    setOpen(false);
    setForm(empty);
    setEditId(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Deactivate this customer?')) return;
    await api.delete(`/customers/${id}`);
    load();
  }

  function openEdit(c) {
    setEditId(c.id);
    setForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      pincode: c.pincode || '',
      notes: c.notes || '',
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="toolbar">
        <input className="input" placeholder="Search customers" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}>
          <Plus size={16} /> Add Customer
        </button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Orders</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.email || '—'}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.city || '—'}</td>
                <td>{c._count?.orders || 0}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="empty">No customers found</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title={editId ? 'Edit Customer' : 'Add Customer'} onClose={() => setOpen(false)} onSubmit={save}>
        {['name', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'notes'].map((k) => (
          <div className="form-group" key={k}>
            <label style={{ textTransform: 'capitalize' }}>{k}</label>
            <input className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
      </Modal>
    </div>
  );
}
