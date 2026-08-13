import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const empty = { name: '', email: '', password: 'changeme123', roleId: '', phone: '', isActive: true };

export default function Users() {
  const { page, setPage, search, setSearch, status, setStatus } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function load() {
    const [u, r] = await Promise.all([
      api.get('/users', {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          isActive: status === 'ACTIVE' ? 'true' : status === 'INACTIVE' ? 'false' : undefined,
        },
      }),
      api.get('/roles'),
    ]);
    setRows(u.data.data);
    setMeta(u.data.meta);
    setRoles(r.data.data);
  }

  useEffect(() => { load().catch(console.error); }, [page, search, status]);

  async function save() {
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      roleId: form.roleId,
      isActive: form.isActive,
    };
    if (editId) {
      if (form.password) payload.password = form.password;
      await api.put(`/users/${editId}`, payload);
    } else {
      await api.post('/users', { ...payload, password: form.password || 'changeme123' });
    }
    setOpen(false);
    setForm(empty);
    setEditId(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}`);
    load();
  }

  function openEdit(u) {
    setEditId(u.id);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      roleId: u.roleId || u.role?.id || '',
      phone: u.phone || '',
      isActive: u.isActive !== false,
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search users" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}>
          <Plus size={16} /> Add User
        </button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-blue">{u.role?.name}</span></td>
                <td>{u.phone || '—'}</td>
                <td><span className={`badge ${statusBadge(u.isActive ? 'ACTIVE' : 'INACTIVE')}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(u.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title={editId ? 'Edit User' : 'Add User'} onClose={() => setOpen(false)} onSubmit={save}>
        <div className="form-group"><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-group"><label>Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="form-group">
          <label>{editId ? 'New Password (optional)' : 'Password'}</label>
          <input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="form-group"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="form-group">
          <label>Role</label>
          <select className="select" style={{ width: '100%' }} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
            <option value="">Select</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active
        </label>
      </Modal>
    </div>
  );
}
