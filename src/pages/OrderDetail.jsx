import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { fmtDate, inr, statusBadge } from '../lib/api';

const FLOW = ['PLACED','PAYMENT_RECEIVED','CONFIRMED','PROCESSING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED'];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [users, setUsers] = useState([]);

  async function load() {
    const { data } = await api.get(`/orders/${id}`);
    setOrder(data.data);
  }

  useEffect(() => {
    load().catch(console.error);
    api.get('/users').then((r) => setUsers(r.data.data)).catch(() => {});
  }, [id]);

  async function setStatus(status) {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  }

  async function assignStaff(staffId) {
    await api.patch(`/orders/${id}/assign-staff`, { staffId });
    load();
  }

  async function assignDelivery() {
    const assignedToId = users[0]?.id;
    await api.patch(`/orders/${id}/assign-delivery`, {
      courierName: 'Refurbicon Express',
      trackingNo: `TRK${Date.now().toString().slice(-8)}`,
      assignedToId,
    });
    load();
  }

  if (!order) return <div className="loading">Loading order...</div>;
  const idx = FLOW.indexOf(order.status);

  return (
    <div>
      <div className="toolbar">
        <Link className="btn btn-ghost" to="/orders">← Back</Link>
        <div className="toolbar-right">
          <button className="btn btn-danger" onClick={() => setStatus('CANCELLED')}>Cancel Order</button>
          <select className="select" value={order.assignedStaffId || ''} onChange={(e) => assignStaff(e.target.value)}>
            <option value="">Assign Staff</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={assignDelivery}>Assign Delivery</button>
          <button className="btn btn-primary" onClick={() => setStatus('OUT_FOR_DELIVERY')}>Mark as Shipped</button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="detail-header">
          <div>
            <h2 className="brand-font" style={{ margin: 0 }}>{order.orderNo}</h2>
            <p style={{ color: 'var(--muted)' }}>{fmtDate(order.orderDate)} · {order.customer?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className={`badge ${statusBadge(order.paymentStatus)}`}>{order.paymentStatus}</span>
            <span className={`badge ${statusBadge(order.status)}`}>{order.status.replaceAll('_', ' ')}</span>
          </div>
        </div>
        <div className="spec-grid">
          <div className="spec-item"><span>Customer</span><strong>{order.customer?.name}</strong><div style={{ fontSize: 12, color: 'var(--muted)' }}>{order.customer?.phone}</div></div>
          <div className="spec-item"><span>Shipping</span><strong>{order.shippingAddress || '—'}</strong><div style={{ fontSize: 12, color: 'var(--muted)' }}>{order.shippingCity} {order.shippingPincode}</div></div>
          <div className="spec-item"><span>Payment Method</span><strong>{order.paymentMethod || '—'}</strong></div>
          <div className="spec-item"><span>Assigned Staff</span><strong>{order.assignedStaff?.name || 'Unassigned'}</strong></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <h3 className="section-title">Order Items</h3>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
              <tbody>
                {order.items?.map((i) => (
                  <tr key={i.id}>
                    <td>{i.product?.name}</td>
                    <td>{i.product?.sku}</td>
                    <td>{inr(i.unitPrice)}</td>
                    <td>{i.quantity}</td>
                    <td>{inr(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, maxWidth: 280, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Subtotal</span><strong>{inr(order.subtotal)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Delivery</span><strong>{inr(order.deliveryCharge)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Discount</span><strong>-{inr(order.discount)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 18 }}><span>Total</span><strong>{inr(order.totalAmount)}</strong></div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FLOW.map((s) => (
              <button key={s} className="btn btn-ghost btn-sm" disabled={order.status === 'CANCELLED'} onClick={() => setStatus(s)}>
                → {s.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="section-title">Order Timeline</h3>
          <ul className="timeline" style={{ marginTop: 16 }}>
            {FLOW.map((s, i) => {
              const log = order.statusLogs?.find((l) => l.status === s);
              const cls = order.status === 'CANCELLED' ? '' : i < idx ? 'done' : i === idx ? 'current' : '';
              return (
                <li key={s} className={cls}>
                  <div className="t-title">{s.replaceAll('_', ' ')}</div>
                  <div className="t-meta">{log ? `${log.note || ''} · ${fmtDate(log.createdAt)}` : 'Pending'}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
