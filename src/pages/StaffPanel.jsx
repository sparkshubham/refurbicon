import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { fmtDate, inr, statusBadge } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function StaffPanel() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);

  async function load() {
    const { data: res } = await api.get('/staff/me', { params: { month, year } });
    setData(res.data);
  }

  useEffect(() => { load().catch(console.error); }, [month, year]);

  if (!data) return <div className="loading">Loading staff panel...</div>;

  const sales = data.sales || { salesCount: 0, salesAmount: 0, paidAmount: 0, orders: [] };
  const bonus = data.bonus;

  return (
    <div>
      <div className="toolbar">
        <div>
          <h2 className="brand-font" style={{ margin: 0 }}>Staff Panel</h2>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>
            {user?.name}
            {data.employee ? ` · ${data.employee.designation || 'Staff'}` : ''}
          </p>
        </div>
        <div className="toolbar-right">
          <select className="select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select className="select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="card card-pad">
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Orders (sales)</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{sales.salesCount}</div>
        </div>
        <div className="card card-pad">
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Sales amount</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{inr(sales.salesAmount)}</div>
        </div>
        <div className="card card-pad">
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Paid sales</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{inr(sales.paidAmount)}</div>
        </div>
        <div className="card card-pad">
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Open tickets</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{data.openTickets}</div>
          <Link to="/tickets" style={{ fontSize: 13 }}>View tickets →</Link>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card card-pad">
          <h3 className="section-title">Sales bonus review</h3>
          {bonus ? (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span className={`badge ${statusBadge(bonus.status)}`}>{bonus.status}</span>
                <span className="badge badge-blue">Rating {bonus.rating}/10</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Bonus %</span><strong>{bonus.bonusPercent}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Bonus amount</span><strong>{inr(bonus.bonusAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Sales counted</span><strong>{inr(bonus.salesAmount)} ({bonus.salesCount} orders)</strong>
              </div>
              {bonus.reviewNotes && <p style={{ color: 'var(--muted)', marginTop: 12 }}>{bonus.reviewNotes}</p>}
              {bonus.reviewedBy && (
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>Reviewed by {bonus.reviewedBy.name}</p>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>No bonus review for this month yet. Manager will review your sales and set a bonus.</p>
          )}
        </div>
        <div className="card card-pad">
          <h3 className="section-title">How bonus works</h3>
          <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', lineHeight: 1.7 }}>
            <li>Orders assigned to you count as your sales.</li>
            <li>Manager reviews monthly sales &amp; rating.</li>
            <li>Approved bonus % applies on paid sales.</li>
            <li>Bonus is added to your payroll payslip.</li>
          </ol>
        </div>
      </div>

      <div className="card table-wrap">
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <h3 className="section-title">My sales this month</h3>
        </div>
        <table className="data">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(sales.orders || []).map((o) => (
              <tr key={o.id}>
                <td><Link to={`/orders/${o.id}`}>{o.orderNo}</Link></td>
                <td>{o.customer?.name}</td>
                <td>{fmtDate(o.orderDate)}</td>
                <td>{o._count?.items || 0}</td>
                <td>{inr(o.totalAmount)}</td>
                <td><span className={`badge ${statusBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                <td><span className={`badge ${statusBadge(o.status)}`}>{o.status.replaceAll('_', ' ')}</span></td>
              </tr>
            ))}
            {!sales.orders?.length && (
              <tr><td colSpan={7} className="empty">No assigned sales this month</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
