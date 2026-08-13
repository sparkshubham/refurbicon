import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Trash2 } from 'lucide-react';
import api, { fmtDate, inr, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const emptyLine = () => ({ productId: '', quantity: 1, unitPrice: 0, description: '' });

export default function Invoices() {
  const { page, setPage, search, setSearch, status, setStatus } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    status: 'ISSUED',
    taxPercent: 18,
    discount: 0,
    notes: '',
    dueDate: '',
    items: [emptyLine()],
  });

  async function load() {
    const { data } = await api.get('/invoices', {
      params: { page, limit: 15, search: search || undefined, status: status || undefined },
    });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [page, search, status]);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((s, i) => s + Number(i.unitPrice || 0) * Number(i.quantity || 0), 0);
    const taxAmount = (subtotal * Number(form.taxPercent || 0)) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - Number(form.discount || 0));
    return { subtotal, taxAmount, totalAmount };
  }, [form.items, form.taxPercent, form.discount]);

  async function openCreate() {
    const [c, p] = await Promise.all([
      api.get('/customers', { params: { limit: 100 } }),
      api.get('/products', { params: { limit: 100 } }),
    ]);
    setCustomers(c.data.data);
    setProducts(p.data.data);
    setForm({
      customerId: '',
      status: 'ISSUED',
      taxPercent: 18,
      discount: 0,
      notes: '',
      dueDate: '',
      items: [emptyLine()],
    });
    setOpen(true);
  }

  function updateLine(idx, patch) {
    setForm((f) => {
      const items = f.items.map((row, i) => {
        if (i !== idx) return row;
        const next = { ...row, ...patch };
        if (patch.productId) {
          const prod = products.find((p) => p.id === patch.productId);
          if (prod) {
            next.unitPrice = Number(prod.price || 0);
            next.description = prod.name;
          }
        }
        return next;
      });
      return { ...f, items };
    });
  }

  async function save() {
    const items = form.items.filter((i) => i.productId || i.description);
    if (!form.customerId || !items.length) {
      alert('Select customer and at least one product');
      return;
    }
    await api.post('/invoices', {
      customerId: form.customerId,
      status: form.status,
      taxPercent: Number(form.taxPercent || 0),
      discount: Number(form.discount || 0),
      notes: form.notes,
      dueDate: form.dueDate || undefined,
      items: items.map((i) => ({
        productId: i.productId || undefined,
        description: i.description,
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unitPrice || 0),
      })),
    });
    setOpen(false);
    load();
  }

  async function setInvoiceStatus(id, next) {
    await api.patch(`/invoices/${id}`, { status: next });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
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
            placeholder="Search invoice / customer"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Invoice</button>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Invoice No</th><th>Customer</th><th>Date</th><th>Items</th>
              <th>Total</th><th>Payment</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.invoiceNo}</td>
                <td>{r.customer?.name}</td>
                <td>{fmtDate(r.invoiceDate)}</td>
                <td>{r.items?.length || 0}</td>
                <td>{inr(r.totalAmount)}</td>
                <td><span className={`badge ${statusBadge(r.paymentStatus)}`}>{r.paymentStatus}</span></td>
                <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                <td>
                  <div className="row-actions">
                    <Link className="btn btn-ghost btn-sm" to={`/invoices/${r.id}`}><Eye size={14} /></Link>
                    {r.status === 'ISSUED' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setInvoiceStatus(r.id, 'PAID')}>Mark Paid</button>
                    )}
                    {r.status !== 'CANCELLED' && r.status !== 'PAID' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setInvoiceStatus(r.id, 'CANCELLED')}>Cancel</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />

      <Modal open={open} title="Create Sales Invoice" onClose={() => setOpen(false)} onSubmit={save} wide>
        <div className="form-group">
          <label>Customer</label>
          <select className="select" style={{ width: '100%' }} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
            <option value="">Select customer</option>
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
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 36px', gap: 8, marginBottom: 8 }}>
              <select className="select" value={line.productId} onChange={(e) => updateLine(idx, { productId: e.target.value })}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({inr(p.price)})</option>)}
              </select>
              <input className="input" type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} placeholder="Qty" />
              <input className="input" type="number" value={line.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: e.target.value })} placeholder="Price" />
              <button type="button" className="btn btn-ghost btn-sm" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Tax %</label>
            <input className="input" type="number" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Discount</label>
            <input className="input" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div style={{ textAlign: 'right', fontSize: 14, color: 'var(--muted)' }}>
          Subtotal {inr(totals.subtotal)} · Tax {inr(totals.taxAmount)} · <strong style={{ color: 'var(--text)' }}>Total {inr(totals.totalAmount)}</strong>
        </div>
      </Modal>
    </div>
  );
}
