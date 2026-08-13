import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Trash2 } from 'lucide-react';
import api, { fmtDate, inr, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const emptyLine = () => ({ productId: '', quantity: 1 });

export default function Orders() {
  const { search, setSearch, status, setStatus, page, setPage } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customerId: '',
    paymentMethod: 'UPI',
    shippingAddress: '',
    shippingCity: '',
    deliveryCharge: 199,
    discount: 0,
    items: [emptyLine()],
  });

  async function load() {
    const { data } = await api.get('/orders', { params: { search, status, page, limit: 12 } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [search, status, page]);

  async function openCreate() {
    const [c, p] = await Promise.all([
      api.get('/customers', { params: { limit: 100 } }),
      api.get('/products', { params: { limit: 100, status: 'PUBLISHED' } }),
    ]);
    setCustomers(c.data.data);
    setProducts(p.data.data);
    setForm({
      customerId: '',
      paymentMethod: 'UPI',
      shippingAddress: '',
      shippingCity: '',
      deliveryCharge: 199,
      discount: 0,
      items: [emptyLine()],
    });
    setOpen(true);
  }

  async function save() {
    const items = form.items.filter((i) => i.productId);
    if (!form.customerId || !items.length) {
      alert('Select customer and at least one product');
      return;
    }
    await api.post('/orders', {
      customerId: form.customerId,
      paymentMethod: form.paymentMethod,
      shippingAddress: form.shippingAddress,
      shippingCity: form.shippingCity,
      deliveryCharge: Number(form.deliveryCharge || 0),
      discount: Number(form.discount || 0),
      items: items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity || 1) })),
    });
    setOpen(false);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search orders" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All Status</option>
            {['PLACED','PAYMENT_RECEIVED','CONFIRMED','PROCESSING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map((s) => (
              <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Create Order</button>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>{o.orderNo}</td>
                <td>{o.customer?.name}</td>
                <td>{fmtDate(o.orderDate)}</td>
                <td>{o._count?.items || 0}</td>
                <td>{inr(o.totalAmount)}</td>
                <td><span className={`badge ${statusBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                <td><span className={`badge ${statusBadge(o.status)}`}>{o.status.replaceAll('_', ' ')}</span></td>
                <td>
                  <div className="row-actions">
                    <Link className="btn btn-ghost btn-sm" to={`/orders/${o.id}`}><Eye size={14} /></Link>
                    {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (!confirm('Cancel this order?')) return;
                          await api.patch(`/orders/${o.id}/status`, { status: 'CANCELLED', note: 'Cancelled from list' });
                          load();
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
      <Modal open={open} title="Create Order" onClose={() => setOpen(false)} onSubmit={save} wide>
        <div className="form-group">
          <label>Customer</label>
          <select className="select" style={{ width: '100%' }} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
            <option value="">Select</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Products</strong>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ ...form, items: [...form.items, emptyLine()] })}>
              <Plus size={14} /> Add product
            </button>
          </div>
          {form.items.map((line, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 36px', gap: 8, marginBottom: 8 }}>
              <select
                className="select"
                value={line.productId}
                onChange={(e) => {
                  const items = form.items.map((row, i) => (i === idx ? { ...row, productId: e.target.value } : row));
                  setForm({ ...form, items });
                }}
              >
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({inr(p.price)})</option>)}
              </select>
              <input
                className="input"
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => {
                  const items = form.items.map((row, i) => (i === idx ? { ...row, quantity: e.target.value } : row));
                  setForm({ ...form, items });
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={form.items.length === 1}
                onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="form-group"><label>Shipping Address</label><input className="input" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} /></div>
        <div className="form-group"><label>City</label><input className="input" value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Payment Method</label>
            <select className="select" style={{ width: '100%' }} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option>UPI</option><option>Card</option><option>COD</option><option>Bank Transfer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Delivery</label>
            <input className="input" type="number" value={form.deliveryCharge} onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Discount</label>
            <input className="input" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
