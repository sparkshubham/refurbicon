import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { fmtDate, inr, statusBadge } from '../lib/api';
import { Modal, Pagination, useListState } from '../components/ui';

const emptyLine = () => ({ productId: '', quantity: 1, unitCost: 0 });
const emptySupplier = { name: '', email: '', phone: '', address: '' };

export default function Purchases() {
  const { page, setPage, search, setSearch, status, setStatus } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [form, setForm] = useState({ supplierId: '', status: 'RECEIVED', notes: '', items: [emptyLine()] });
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [editSupplierId, setEditSupplierId] = useState(null);
  const [detail, setDetail] = useState(null);

  async function load() {
    const [p, s, pr] = await Promise.all([
      api.get('/purchases', { params: { page, limit: 15, search: search || undefined, status: status || undefined } }),
      api.get('/purchases/suppliers'),
      api.get('/products', { params: { limit: 100 } }),
    ]);
    setRows(p.data.data);
    setMeta(p.data.meta);
    setSuppliers(s.data.data);
    setProducts(pr.data.data);
  }

  useEffect(() => { load().catch(console.error); }, [page, search, status]);

  function updateLine(idx, patch) {
    setForm((f) => {
      const items = f.items.map((row, i) => {
        if (i !== idx) return row;
        const next = { ...row, ...patch };
        if (patch.productId) {
          const prod = products.find((p) => p.id === patch.productId);
          if (prod) next.unitCost = Number(prod.costPrice || 0);
        }
        return next;
      });
      return { ...f, items };
    });
  }

  async function save() {
    const items = form.items.filter((i) => i.productId);
    if (!form.supplierId || !items.length) {
      alert('Select supplier and at least one product');
      return;
    }
    await api.post('/purchases', {
      supplierId: form.supplierId,
      status: form.status,
      notes: form.notes,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitCost: Number(i.unitCost),
      })),
    });
    setOpen(false);
    setForm({ supplierId: '', status: 'RECEIVED', notes: '', items: [emptyLine()] });
    load();
  }

  async function saveSupplier() {
    if (editSupplierId) await api.put(`/purchases/suppliers/${editSupplierId}`, supplierForm);
    else await api.post('/purchases/suppliers', supplierForm);
    setSupplierOpen(false);
    setSupplierForm(emptySupplier);
    setEditSupplierId(null);
    load();
  }

  async function removePurchase(id) {
    if (!confirm('Delete this purchase? Stock will be reversed if it was received.')) return;
    await api.delete(`/purchases/${id}`);
    load();
  }

  async function setPurchaseStatus(id, next) {
    await api.patch(`/purchases/${id}`, { status: next });
    load();
  }

  async function createBillFromPurchase(purchaseId) {
    try {
      const { data } = await api.post('/bills', { purchaseId, status: 'RECEIVED', applyStock: false, taxPercent: 18 });
      alert(`Bill ${data.data.billNo} created`);
      window.location.href = `/bills/${data.data.id}`;
    } catch (e) {
      alert(e.response?.data?.message || 'Could not create bill');
    }
  }

  async function removeSupplier(id) {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/purchases/suppliers/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  }

  async function viewDetail(id) {
    const { data } = await api.get(`/purchases/${id}`);
    setDetail(data.data);
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search purchase / supplier" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={() => { setEditSupplierId(null); setSupplierForm(emptySupplier); setSupplierOpen(true); }}>
            <Plus size={16} /> Supplier
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ supplierId: '', status: 'RECEIVED', notes: '', items: [emptyLine()] }); setOpen(true); }}>
            <Plus size={16} /> New Purchase
          </button>
        </div>
      </div>

      <div className="card table-wrap" style={{ marginBottom: 16 }}>
        <table className="data">
          <thead><tr><th>Purchase No</th><th>Supplier</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => viewDetail(r.id)}>{r.purchaseNo}</button>
                </td>
                <td>{r.supplier?.name}</td>
                <td>{fmtDate(r.purchaseDate)}</td>
                <td>{r.items?.length || 0}</td>
                <td>{inr(r.totalAmount)}</td>
                <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                <td>
                  <div className="row-actions">
                    {r.status === 'PENDING' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setPurchaseStatus(r.id, 'RECEIVED')}>Receive</button>
                    )}
                    {r.status === 'RECEIVED' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => createBillFromPurchase(r.id)}>Create Bill</button>
                    )}
                    {r.status !== 'CANCELLED' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setPurchaseStatus(r.id, 'CANCELLED')}>Cancel</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => removePurchase(r.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />

      <div className="card table-wrap" style={{ marginTop: 18 }}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <h3 className="section-title">Suppliers</h3>
        </div>
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th></tr></thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>{s.email || '—'}</td>
                <td>{s.phone || '—'}</td>
                <td>{s.address || '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      setEditSupplierId(s.id);
                      setSupplierForm({ name: s.name || '', email: s.email || '', phone: s.phone || '', address: s.address || '' });
                      setSupplierOpen(true);
                    }}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => removeSupplier(s.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Create Purchase" onClose={() => setOpen(false)} onSubmit={save} wide>
        <div className="form-group">
          <label>Supplier</label>
          <select className="select" style={{ width: '100%' }} value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">Select</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="input" type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} />
              <input className="input" type="number" value={line.unitCost} onChange={(e) => updateLine(idx, { unitCost: e.target.value })} />
              <button type="button" className="btn btn-ghost btn-sm" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Status</label>
          <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="PENDING">Pending</option>
            <option value="RECEIVED">Received</option>
          </select>
        </div>
        <div className="form-group"><label>Notes</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </Modal>

      <Modal open={supplierOpen} title={editSupplierId ? 'Edit Supplier' : 'Add Supplier'} onClose={() => setSupplierOpen(false)} onSubmit={saveSupplier}>
        {['name', 'email', 'phone', 'address'].map((k) => (
          <div className="form-group" key={k}>
            <label style={{ textTransform: 'capitalize' }}>{k}</label>
            <input className="input" value={supplierForm[k]} onChange={(e) => setSupplierForm({ ...supplierForm, [k]: e.target.value })} />
          </div>
        ))}
      </Modal>

      <Modal open={!!detail} title={detail ? `Purchase ${detail.purchaseNo}` : ''} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <p><strong>Supplier:</strong> {detail.supplier?.name}</p>
            <p><strong>Status:</strong> {detail.status}</p>
            <p><strong>Total:</strong> {inr(detail.totalAmount)}</p>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="data">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
                <tbody>
                  {(detail.items || []).map((i) => (
                    <tr key={i.id}>
                      <td>{i.product?.name}</td>
                      <td>{i.quantity}</td>
                      <td>{inr(i.unitCost)}</td>
                      <td>{inr(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
