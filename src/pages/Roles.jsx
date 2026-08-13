import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { Modal } from '../components/ui';

const empty = { name: '', description: '', permissions: '*' };

export default function Roles() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function load() {
    const { data } = await api.get('/roles');
    setRows(data.data);
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function save() {
    const payload = {
      name: form.name,
      description: form.description,
      permissions: form.permissions.split(',').map((p) => p.trim()).filter(Boolean),
    };
    if (editId) await api.put(`/roles/${editId}`, payload);
    else await api.post('/roles', payload);
    setOpen(false);
    setForm(empty);
    setEditId(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this role?')) return;
    try {
      await api.delete(`/roles/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  }

  function openEdit(r) {
    setEditId(r.id);
    setForm({
      name: r.name || '',
      description: r.description || '',
      permissions: (r.permissions || []).join(', '),
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="toolbar">
        <h3 className="section-title" style={{ margin: 0 }}>Roles & Permissions</h3>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}>
          <Plus size={16} /> Add Role
        </button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Role</th><th>Description</th><th>Permissions</th><th>Users</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td>{r.description || '—'}</td>
                <td style={{ whiteSpace: 'normal', maxWidth: 360 }}>{(r.permissions || []).join(', ')}</td>
                <td>{r._count?.users || 0}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title={editId ? 'Edit Role' : 'Add Role'} onClose={() => setOpen(false)} onSubmit={save}>
        <div className="form-group"><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-group"><label>Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="form-group"><label>Permissions (comma separated, use * for all)</label><input className="input" value={form.permissions} onChange={(e) => setForm({ ...form, permissions: e.target.value })} /></div>
      </Modal>
    </div>
  );
}
