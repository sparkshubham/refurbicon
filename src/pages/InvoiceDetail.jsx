import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { fmtDate, inr, statusBadge } from '../lib/api';

export default function InvoiceDetail() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);

  useEffect(() => {
    api.get(`/invoices/${id}`).then((r) => setInv(r.data.data)).catch(console.error);
  }, [id]);

  if (!inv) return <div className="loading">Loading invoice...</div>;

  return (
    <div>
      <div className="toolbar no-print">
        <Link className="btn btn-ghost" to="/invoices">← Back</Link>
        <button className="btn btn-primary" onClick={() => window.print()}>Print Invoice</button>
      </div>

      <div className="payslip">
        <div className="payslip-head">
          <div>
            <h2 className="brand-font" style={{ margin: 0, color: 'var(--primary)' }}>REFURBICON</h2>
            <div style={{ color: 'var(--muted)' }}>Sales Invoice</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>{inv.invoiceNo}</strong>
            <div>{fmtDate(inv.invoiceDate)}</div>
            <div style={{ marginTop: 6 }}>
              <span className={`badge ${statusBadge(inv.status)}`}>{inv.status}</span>{' '}
              <span className={`badge ${statusBadge(inv.paymentStatus)}`}>{inv.paymentStatus}</span>
            </div>
          </div>
        </div>

        <div className="payslip-grid" style={{ marginBottom: 18 }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>Bill To</div>
            <strong>{inv.customer?.name}</strong>
            <div style={{ color: 'var(--muted)' }}>{inv.customer?.phone || '—'}</div>
            <div style={{ color: 'var(--muted)' }}>{inv.customer?.email || '—'}</div>
            <div style={{ color: 'var(--muted)' }}>{inv.customer?.address || ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {inv.order?.orderNo && <div>Order: {inv.order.orderNo}</div>}
            {inv.dueDate && <div>Due: {fmtDate(inv.dueDate)}</div>}
            {inv.createdBy?.name && <div>Created by: {inv.createdBy.name}</div>}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>#</th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {(inv.items || []).map((i, n) => (
                <tr key={i.id}>
                  <td>{n + 1}</td>
                  <td>{i.product?.name || i.description || '—'}</td>
                  <td>{i.product?.sku || '—'}</td>
                  <td>{i.quantity}</td>
                  <td>{inr(i.unitPrice)}</td>
                  <td>{inr(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, maxWidth: 280, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Subtotal</span><strong>{inr(inv.subtotal)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Tax ({inv.taxPercent}%)</span><strong>{inr(inv.taxAmount)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Discount</span><strong>{inr(inv.discount)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, fontWeight: 700 }}>
            <span>Total</span><span>{inr(inv.totalAmount)}</span>
          </div>
        </div>

        {inv.notes && <p style={{ marginTop: 18, color: 'var(--muted)' }}>Notes: {inv.notes}</p>}
      </div>
    </div>
  );
}
