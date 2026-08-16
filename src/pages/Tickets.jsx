import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Trash2 } from 'lucide-react';
import api, { fmtDate, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const CATEGORIES = ['GENERAL', 'ORDER', 'PRODUCT', 'WARRANTY', 'BILLING', 'OTHER'];

export default function Tickets() {
  const { user } = useAuth();
  const isStaff = user?.role?.name === 'Staff';
  const { page, setPage, search, setSearch, status, setStatus } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    customerId: '',
    assignedToId: '',
  });

  async function load() {
    const { data } = await api.get('/tickets', {
      params: {
        page,
        limit: 15,
        search: search || undefined,
        status: status || undefined,
        mine: isStaff ? '1' : undefined,
      },
    });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [page, search, status, isStaff]);

  async function openCreate() {
    if (!isStaff) {
      const [u, c] = await Promise.all([
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/customers', { params: { limit: 100 } }),
      ]);
      setUsers(u.data.data || []);
      setCustomers(c.data.data || []);
    }
    setForm({
      subject: '',
      description: '',
      category: 'GENERAL',
      priority: 'MEDIUM',
      customerId: '',
      assignedToId: '',
    });
    setOpen(true);
  }

  async function save() {
    if (!form.subject.trim()) {
      alert('Subject required');
      return;
    }
    await api.post('/tickets', {
      ...form,
      customerId: form.customerId || undefined,
      assignedToId: form.assignedToId || undefined,
    });
    setOpen(false);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this ticket?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="input"
            placeholder="Search tickets"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Ticket</button>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Ticket</th><th>Subject</th><th>Category</th><th>Priority</th>
              <th>Assignee</th><th>Status</th><th>Updated</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.ticketNo}</td>
                <td>{t.subject}</td>
                <td>{t.category}</td>
                <td><span className={`badge ${statusBadge(t.priority)}`}>{t.priority}</span></td>
                <td>{t.assignedTo?.name || 'Unassigned'}</td>
                <td><span className={`badge ${statusBadge(t.status)}`}>{t.status.replaceAll('_', ' ')}</span></td>
                <td>{fmtDate(t.updatedAt)}</td>
                <td>
                  <div className="row-actions">
                    <Link className="btn btn-ghost btn-sm" to={`/tickets/${t.id}`}><Eye size={14} /></Link>
                    {!isStaff && (
                      <button className="btn btn-danger btn-sm" onClick={() => remove(t.id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={8} className="empty">No tickets yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />

      <Modal open={open} title="Create Ticket" onClose={() => setOpen(false)} onSubmit={save} wide>
        <div className="form-group">
          <label>Subject</label>
          <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Category</label>
            <select className="select" style={{ width: '100%' }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="select" style={{ width: '100%' }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          {!isStaff && (
            <div className="form-group">
              <label>Assign to</label>
              <select className="select" style={{ width: '100%' }} value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
        </div>
        {!isStaff && (
          <div className="form-group">
            <label>Customer (optional)</label>
            <select className="select" style={{ width: '100%' }} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">None</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </Modal>
    </div>
  );
}
