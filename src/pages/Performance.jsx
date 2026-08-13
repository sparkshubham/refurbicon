import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const empty = { employeeId: '', period: 'Q3 2026', rating: 4, goals: '', feedback: '' };

function ratingValue(value) {
  if (value == null) return 0;
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function PerformancePage() {
  const { page, setPage, search, setSearch } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/performance', {
        params: { page, limit: 15, search: search || undefined },
      });
      setRows(Array.isArray(data.data) ? data.data : []);
      setMeta(data.meta || null);
    } catch (e) {
      setRows([]);
      setError(e.response?.data?.message || e.message || 'Failed to load performance reviews');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search]);

  async function openCreate() {
    const { data } = await api.get('/employees', { params: { limit: 100, status: 'ACTIVE' } });
    setEmployees(data.data || []);
    setEditId(null);
    setForm(empty);
    setOpen(true);
  }

  async function openEdit(r) {
    const { data } = await api.get('/employees', { params: { limit: 100 } });
    setEmployees(data.data || []);
    setEditId(r.id);
    setForm({
      employeeId: r.employeeId,
      period: r.period || '',
      rating: ratingValue(r.rating),
      goals: r.goals || '',
      feedback: r.feedback || '',
    });
    setOpen(true);
  }

  async function save() {
    const payload = { ...form, rating: ratingValue(form.rating) };
    if (editId) await api.put(`/performance/${editId}`, payload);
    else await api.post('/performance', payload);
    setOpen(false);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/performance/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search employee / period"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Review
        </button>
      </div>

      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Period</th>
              <th>Rating</th>
              <th>Goals</th>
              <th>Reviewed By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="empty">Loading reviews...</td></tr>
            )}
            {!loading && rows.map((r) => (
              <tr key={r.id}>
                <td>{r.employee?.firstName} {r.employee?.lastName}</td>
                <td>{r.period}</td>
                <td>
                  <span className={`badge ${statusBadge('ACTIVE')}`}>
                    {ratingValue(r.rating).toFixed(1)}/5
                  </span>
                </td>
                <td style={{ maxWidth: 280, whiteSpace: 'normal' }}>{r.goals || '—'}</td>
                <td>{r.reviewedBy || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !rows.length && (
              <tr><td colSpan={6} className="empty">No performance reviews yet. Click “Add Review” to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />

      <Modal open={open} title={editId ? 'Edit Review' : 'Performance Review'} onClose={() => setOpen(false)} onSubmit={save}>
        <div className="form-group">
          <label>Employee</label>
          <select
            className="select"
            style={{ width: '100%' }}
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          >
            <option value="">Select</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Period</label>
          <input className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Rating (1-5)</label>
          <input
            className="input"
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Goals</label>
          <textarea className="textarea" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Feedback</label>
          <textarea className="textarea" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
