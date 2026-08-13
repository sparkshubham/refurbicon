import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { fmtDate, inr, statusBadge } from '../lib/api';
import { Pagination, useListState } from '../components/ui';

export default function Sales() {
  const { page, setPage } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    api.get('/sales', { params: { page, limit: 15 } }).then((r) => { setRows(r.data.data); setMeta(r.data.meta); });
    api.get('/sales/summary').then((r) => setSummary(r.data.data));
  }, [page]);

  return (
    <div>
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <h3 className="section-title">Sales (30 days)</h3>
        <p className="section-sub">Revenue: {inr(meta?.revenue || 0)}</p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" hide />
              <YAxis />
              <Tooltip formatter={(v) => inr(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#0056b3" fill="#dbeafe" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><Link to={`/orders/${o.id}`}>{o.orderNo}</Link></td>
                <td>{o.customer?.name}</td>
                <td>{fmtDate(o.orderDate)}</td>
                <td>{inr(o.totalAmount)}</td>
                <td><span className={`badge ${statusBadge(o.status)}`}>{o.status.replaceAll('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
    </div>
  );
}
