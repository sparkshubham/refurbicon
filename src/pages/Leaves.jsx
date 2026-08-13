import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { fmtDay, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const empty = { employeeId: '', leaveType: 'Casual', startDate: '', endDate: '', reason: '' };

export default function Leaves() {
  const { page, setPage, status, setStatus } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function load() {
    const { data } = await api.get('/leaves', { params: { page, status, limit: 15 } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [page, status]);

  async function openCreate() {
    const { data } = await api.get('/employees', { params: { limit: 100, status: 'ACTIVE' } });
    setEmployees(data.data);
    setEditId(null);
    setForm(empty);
    setOpen(true);
  }

  async function openEdit(l) {
    const { data } = await api.get('/employees', { params: { limit: 100 } });
    setEmployees(data.data);
    setEditId(l.id);
    setForm({
      employeeId: l.employeeId,
      leaveType: l.leaveType,
      startDate: l.startDate?.slice(0, 10) || '',
      endDate: l.endDate?.slice(0, 10) || '',
      reason: l.reason || '',
    });
    setOpen(true);
  }

  async function save() {
    if (editId) await api.put(`/leaves/${editId}`, form);
    else await api.post('/leaves', form);
    setOpen(false);
    load();
  }

  async function setLeaveStatus(id, next) {
    await api.patch(`/leaves/${id}/status`, { status: next });
    load();
  }

  async function remove(id) {
    if (!confirm('Cancel this leave request?')) return;
    await api.delete(`/leaves/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Leave Request</button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td>{l.employee?.firstName} {l.employee?.lastName}</td>
                <td>{l.leaveType}</td>
                <td>{fmtDay(l.startDate)}</td>
                <td>{fmtDay(l.endDate)}</td>
                <td>{l.reason || '—'}</td>
                <td><span className={`badge ${statusBadge(l.status)}`}>{l.status}</span></td>
                <td>
                  <div className="row-actions">
                    {l.status === 'PENDING' && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(l)}><Pencil size={14} /></button>
                        <button className="btn btn-primary btn-sm" onClick={() => setLeaveStatus(l.id, 'APPROVED')}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setLeaveStatus(l.id, 'REJECTED')}>Reject</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => remove(l.id)}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title={editId ? 'Edit Leave' : 'Leave Request'} onClose={() => setOpen(false)} onSubmit={save}>
        <div className="form-group">
          <label>Employee</label>
          <select className="select" style={{ width: '100%' }} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
            <option value="">Select</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Type</label>
          <select className="select" style={{ width: '100%' }} value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
            <option>Casual</option><option>Sick</option><option>Earned</option><option>Unpaid</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group"><label>Start</label><input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div className="form-group"><label>End</label><input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Reason</label><textarea className="textarea" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
      </Modal>
    </div>
  );
}
