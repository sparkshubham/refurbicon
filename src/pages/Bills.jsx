import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Trash2 } from 'lucide-react';
import api, { fmtDate, inr, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const emptyLine = () => ({ productId: '', quantity: 1, unitCost: 0, description: '' });

export default function Bills() {
  const { page, setPage, search, setSearch, status, setStatus } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    supplierId: '',
    status: 'RECEIVED',
    taxPercent: 18,
    discount: 0,
    notes: '',
    dueDate: '',
    applyStock: true,
    items: [emptyLine()],
  });

  async function load() {
    const { data } = await api.get('/bills', {
      params: { page, limit: 15, search: search || undefined, status: status || undefined },
    });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [page, search, status]);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((s, i) => s + Number(i.unitCost || 0) * Number(i.quantity || 0), 0);
    const taxAmount = (subtotal * Number(form.taxPercent || 0)) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - Number(form.discount || 0));
    return { subtotal, taxAmount, totalAmount };
  }, [form.items, form.taxPercent, form.discount]);

  async function openCreate() {
    const [s, p] = await Promise.all([
      api.get('/purchases/suppliers'),
      api.get('/products', { params: { limit: 100 } }),
    ]);
    setSuppliers(s.data.data);
    setProducts(p.data.data);
    setForm({
      supplierId: '',
      status: 'RECEIVED',
      taxPercent: 18,
      discount: 0,
      notes: '',
      dueDate: '',
      applyStock: true,
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
            next.unitCost = Number(prod.costPrice || prod.price || 0);
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
    if (!form.supplierId || !items.length) {
      alert('Select supplier and at least one product');
      return;
    }
    await api.post('/bills', {
      supplierId: form.supplierId,
      status: form.status,
      taxPercent: Number(form.taxPercent || 0),
      discount: Number(form.discount || 0),
      notes: form.notes,
      dueDate: form.dueDate || undefined,
      applyStock: !!form.applyStock,
      items: items.map((i) => ({
        productId: i.productId || undefined,
        description: i.description,
        quantity: Number(i.quantity || 1),
        unitCost: Number(i.unitCost || 0),
      })),
    });
    setOpen(false);
    load();
  }

  async function setBillStatus(id, next) {
    await api.patch(`/bills/${id}`, { status: next });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this bill? Stock will be reversed if it was received.')) return;
    try {
      await api.delete(`/bills/${id}`);
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
            placeholder="Search bill / supplier"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="RECEIVED">Received</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Bill</button>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Bill No</th><th>Supplier</th><th>Date</th><th>Items</th>
              <th>Total</th><th>Payment</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.billNo}</td>
                <td>{r.supplier?.name}</td>
                <td>{fmtDate(r.billDate)}</td>
                <td>{r.items?.length || 0}</td>
                <td>{inr(r.totalAmount)}</td>
                <td><span className={`badge ${statusBadge(r.paymentStatus)}`}>{r.paymentStatus}</span></td>
                <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                <td>
                  <div className="row-actions">
                    <Link className="btn btn-ghost btn-sm" to={`/bills/${r.id}`}><Eye size={14} /></Link>
                    {r.status === 'DRAFT' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setBillStatus(r.id, 'RECEIVED')}>Receive</button>
                    )}
                    {r.status === 'RECEIVED' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setBillStatus(r.id, 'PAID')}>Mark Paid</button>
                    )}
                    {r.status !== 'CANCELLED' && r.status !== 'PAID' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setBillStatus(r.id, 'CANCELLED')}>Cancel</button>
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

      <Modal open={open} title="Create Purchase Bill" onClose={() => setOpen(false)} onSubmit={save} wide>
        <div className="form-group">
          <label>Supplier</label>
          <select className="select" style={{ width: '100%' }} value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Products (one supplier → many products)</strong>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ ...form, items: [...form.items, emptyLine()] })}>
              <Plus size={14} /> Add product
            </button>
          </div>
          {form.items.map((line, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 36px', gap: 8, marginBottom: 8 }}>
              <select className="select" value={line.productId} onChange={(e) => updateLine(idx, { productId: e.target.value })}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="input" type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} placeholder="Qty" />
              <input className="input" type="number" value={line.unitCost} onChange={(e) => updateLine(idx, { unitCost: e.target.value })} placeholder="Cost" />
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Status</label>
            <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Draft</option>
              <option value="RECEIVED">Received</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <div className="form-group">
            <label>Stock</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={form.applyStock} onChange={(e) => setForm({ ...form, applyStock: e.target.checked })} />
              Add stock when Received
            </label>
          </div>
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
