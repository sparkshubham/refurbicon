import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import api, { statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

export default function Deliveries() {
  const { page, setPage, status, setStatus } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [staff, setStaff] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    status: 'PENDING',
    courierName: '',
    trackingNo: '',
    assignedToId: '',
    notes: '',
  });

  async function load() {
    const { data } = await api.get('/deliveries', { params: { page, status, limit: 15 } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [page, status]);

  async function openEdit(d) {
    const { data } = await api.get('/users', { params: { limit: 100, isActive: 'true' } }).catch(() => ({ data: { data: [] } }));
    setStaff(data.data || []);
    setEditId(d.id);
    setForm({
      status: d.status,
      courierName: d.courierName || '',
      trackingNo: d.trackingNo || '',
      assignedToId: d.assignedToId || d.assignedTo?.id || '',
      notes: d.notes || '',
    });
    setOpen(true);
  }

  async function save() {
    await api.patch(`/deliveries/${editId}`, {
      status: form.status,
      courierName: form.courierName || null,
      trackingNo: form.trackingNo || null,
      assignedToId: form.assignedToId || null,
      notes: form.notes || null,
    });
    setOpen(false);
    load();
  }

  async function updateStatus(id, next) {
    await api.patch(`/deliveries/${id}`, { status: next });
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All</option>
          {['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'].map((s) => (
            <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
          ))}
        </select>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Order</th><th>Customer</th><th>Courier</th><th>Tracking</th><th>Assignee</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td><Link to={`/orders/${d.orderId}`}>{d.order?.orderNo}</Link></td>
                <td>{d.order?.customer?.name}</td>
                <td>{d.courierName || '—'}</td>
                <td>{d.trackingNo || '—'}</td>
                <td>{d.assignedTo?.name || '—'}</td>
                <td><span className={`badge ${statusBadge(d.status)}`}>{d.status.replaceAll('_', ' ')}</span></td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(d.id, 'IN_TRANSIT')}>In Transit</button>
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(d.id, 'DELIVERED')}>Delivered</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title="Edit Delivery" onClose={() => setOpen(false)} onSubmit={save}>
        <div className="form-group">
          <label>Status</label>
          <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'].map((s) => (
              <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="form-group"><label>Courier</label><input className="input" value={form.courierName} onChange={(e) => setForm({ ...form, courierName: e.target.value })} /></div>
        <div className="form-group"><label>Tracking No</label><input className="input" value={form.trackingNo} onChange={(e) => setForm({ ...form, trackingNo: e.target.value })} /></div>
        <div className="form-group">
          <label>Assignee</label>
          <select className="select" style={{ width: '100%' }} value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
            <option value="">Unassigned</option>
            {staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Notes</label><textarea className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </Modal>
    </div>
  );
}
