import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { fmtDate, inr, statusBadge } from '../lib/api';

export default function BillDetail() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);

  useEffect(() => {
    api.get(`/bills/${id}`).then((r) => setBill(r.data.data)).catch(console.error);
  }, [id]);

  if (!bill) return <div className="loading">Loading bill...</div>;

  return (
    <div>
      <div className="toolbar no-print">
        <Link className="btn btn-ghost" to="/bills">← Back</Link>
        <button className="btn btn-primary" onClick={() => window.print()}>Print Bill</button>
      </div>

      <div className="payslip">
        <div className="payslip-head">
          <div>
            <h2 className="brand-font" style={{ margin: 0, color: 'var(--primary)' }}>REFURBICON</h2>
            <div style={{ color: 'var(--muted)' }}>Purchase Bill</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>{bill.billNo}</strong>
            <div>{fmtDate(bill.billDate)}</div>
            <div style={{ marginTop: 6 }}>
              <span className={`badge ${statusBadge(bill.status)}`}>{bill.status}</span>{' '}
              <span className={`badge ${statusBadge(bill.paymentStatus)}`}>{bill.paymentStatus}</span>
            </div>
          </div>
        </div>

        <div className="payslip-grid" style={{ marginBottom: 18 }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>Supplier</div>
            <strong>{bill.supplier?.name}</strong>
            <div style={{ color: 'var(--muted)' }}>{bill.supplier?.phone || '—'}</div>
            <div style={{ color: 'var(--muted)' }}>{bill.supplier?.email || '—'}</div>
            <div style={{ color: 'var(--muted)' }}>{bill.supplier?.address || ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {bill.purchase?.purchaseNo && <div>Purchase: {bill.purchase.purchaseNo}</div>}
            {bill.dueDate && <div>Due: {fmtDate(bill.dueDate)}</div>}
            {bill.createdBy?.name && <div>Created by: {bill.createdBy.name}</div>}
            <div>Stock applied: {bill.stockApplied ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>#</th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr>
            </thead>
            <tbody>
              {(bill.items || []).map((i, n) => (
                <tr key={i.id}>
                  <td>{n + 1}</td>
                  <td>{i.product?.name || i.description || '—'}</td>
                  <td>{i.product?.sku || '—'}</td>
                  <td>{i.quantity}</td>
                  <td>{inr(i.unitCost)}</td>
                  <td>{inr(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, maxWidth: 280, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Subtotal</span><strong>{inr(bill.subtotal)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Tax ({bill.taxPercent}%)</span><strong>{inr(bill.taxAmount)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Discount</span><strong>{inr(bill.discount)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, fontWeight: 700 }}>
            <span>Total</span><span>{inr(bill.totalAmount)}</span>
          </div>
        </div>

        {bill.notes && <p style={{ marginTop: 18, color: 'var(--muted)' }}>Notes: {bill.notes}</p>}
      </div>
    </div>
  );
}
