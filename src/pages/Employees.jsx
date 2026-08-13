import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { inr, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const empty = {
  firstName: '', lastName: '', email: '', phone: '', designation: '', departmentId: '',
  basicSalary: 25000, hra: 7000, conveyance: 2000, status: 'ACTIVE', createLogin: false, password: 'staff123',
};

export default function Employees() {
  const { search, setSearch, status, setStatus, page, setPage } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [depts, setDepts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function load() {
    const [e, d] = await Promise.all([
      api.get('/employees', { params: { search, status, page, limit: 15 } }),
      api.get('/employees/departments'),
    ]);
    setRows(e.data.data);
    setMeta(e.data.meta);
    setDepts(d.data.data);
  }

  useEffect(() => { load().catch(console.error); }, [search, status, page]);

  async function save() {
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      designation: form.designation,
      departmentId: form.departmentId || null,
      basicSalary: Number(form.basicSalary),
      hra: Number(form.hra),
      conveyance: Number(form.conveyance),
      status: form.status,
    };
    if (editId) {
      await api.put(`/employees/${editId}`, payload);
    } else {
      await api.post('/employees', { ...payload, createLogin: form.createLogin, password: form.password });
    }
    setOpen(false);
    setForm(empty);
    setEditId(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Deactivate this employee?')) return;
    await api.delete(`/employees/${id}`);
    load();
  }

  function openEdit(e) {
    setEditId(e.id);
    setForm({
      ...empty,
      firstName: e.firstName || '',
      lastName: e.lastName || '',
      email: e.email || '',
      phone: e.phone || '',
      designation: e.designation || '',
      departmentId: e.departmentId || '',
      basicSalary: e.basicSalary ?? 25000,
      hra: e.hra ?? 0,
      conveyance: e.conveyance ?? 0,
      status: e.status || 'ACTIVE',
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search employees" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Photo</th><th>Name</th><th>Employee ID</th><th>Department</th><th>Designation</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="avatar" style={{ display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 700 }}>
                    {e.firstName?.[0]}{e.lastName?.[0]}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{e.firstName} {e.lastName}</td>
                <td>{e.employeeNo}</td>
                <td>{e.department?.name || '—'}</td>
                <td>{e.designation || '—'}</td>
                <td>{inr(e.basicSalary)}</td>
                <td><span className={`badge ${statusBadge(e.status)}`}>{e.status}</span></td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(e.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title={editId ? 'Edit Employee' : 'Add Employee'} onClose={() => setOpen(false)} onSubmit={save}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group"><label>First Name</label><input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
          <div className="form-group"><label>Last Name</label><input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="form-group">
          <label>Department</label>
          <select className="select" style={{ width: '100%' }} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">Select</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Designation</label><input className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div className="form-group"><label>Basic</label><input className="input" type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} /></div>
          <div className="form-group"><label>HRA</label><input className="input" type="number" value={form.hra} onChange={(e) => setForm({ ...form, hra: e.target.value })} /></div>
          <div className="form-group"><label>Conveyance</label><input className="input" type="number" value={form.conveyance} onChange={(e) => setForm({ ...form, conveyance: e.target.value })} /></div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
        {!editId && (
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input type="checkbox" checked={form.createLogin} onChange={(e) => setForm({ ...form, createLogin: e.target.checked })} />
            Create login access
          </label>
        )}
      </Modal>
    </div>
  );
}
