import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { fmtDate, inr, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const empty = { orderId: '', amount: '', method: 'UPI', reference: '', status: 'PAID' };

export default function Payments() {
  const { page, setPage, status, setStatus, search, setSearch } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function load() {
    const { data } = await api.get('/payments', { params: { page, status, search: search || undefined, limit: 15 } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [page, status, search]);

  async function openCreate() {
    const { data } = await api.get('/orders', { params: { paymentStatus: 'PENDING', limit: 50 } });
    setOrders(data.data);
    setEditId(null);
    setForm(empty);
    setOpen(true);
  }

  async function openEdit(p) {
    const { data } = await api.get('/orders', { params: { limit: 50 } });
    setOrders(data.data);
    setEditId(p.id);
    setForm({
      orderId: p.orderId || '',
      amount: p.amount,
      method: p.method,
      reference: p.reference || '',
      status: p.status,
    });
    setOpen(true);
  }

  async function save() {
    if (editId) {
      await api.put(`/payments/${editId}`, {
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference,
        status: form.status,
      });
    } else {
      const order = orders.find((o) => o.id === form.orderId);
      await api.post('/payments', {
        orderId: form.orderId,
        customerId: order?.customerId || order?.customer?.id,
        amount: Number(form.amount || order?.totalAmount || 0),
        method: form.method,
        reference: form.reference,
        status: form.status || 'PAID',
      });
    }
    setOpen(false);
    load();
  }

  async function remove(id) {
    if (!confirm('Mark this payment as refunded?')) return;
    await api.delete(`/payments/${id}`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search payment / order / customer" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Record Payment</button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Payment No</th><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.paymentNo}</td>
                <td>{p.order ? <Link to={`/orders/${p.order.id}`}>{p.order.orderNo}</Link> : '—'}</td>
                <td>{p.customer?.name || '—'}</td>
                <td>{p.method}</td>
                <td>{inr(p.amount)}</td>
                <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                <td>{fmtDate(p.paidAt)}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title={editId ? 'Edit Payment' : 'Record Payment'} onClose={() => setOpen(false)} onSubmit={save}>
        {!editId && (
          <div className="form-group">
            <label>Order</label>
            <select className="select" style={{ width: '100%' }} value={form.orderId} onChange={(e) => {
              const o = orders.find((x) => x.id === e.target.value);
              setForm({ ...form, orderId: e.target.value, amount: o?.totalAmount || '' });
            }}>
              <option value="">Select</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.orderNo} — {o.customer?.name}</option>)}
            </select>
          </div>
        )}
        <div className="form-group"><label>Amount</label><input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        <div className="form-group">
          <label>Method</label>
          <select className="select" style={{ width: '100%' }} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option>UPI</option><option>Card</option><option>Cash</option><option>Bank Transfer</option><option>COD</option>
          </select>
        </div>
        <div className="form-group"><label>Reference</label><input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
        <div className="form-group">
          <label>Status</label>
          <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
