import { useEffect, useState } from 'react';
import api, { inr } from '../lib/api';

export default function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/reports/business').then((r) => setData(r.data.data)); }, []);
  if (!data) return <div className="loading">Loading reports...</div>;

  const cards = [
    ['Total Revenue', inr(data.totalRevenue)],
    ['Total Orders', data.totalOrders],
    ['Delivered', data.delivered],
    ['Customers', data.customers],
    ['Payments Collected', inr(data.paymentsCollected)],
    ['Stock Value', inr(data.stockValue)],
    ['Products', data.products],
    ['Out of Stock', data.outOfStock],
  ];

  return (
    <div className="kpi-grid">
      {cards.map(([label, value]) => (
        <div className="card kpi" key={label}>
          <div className="label">{label}</div>
          <div className="value">{value}</div>
        </div>
      ))}
    </div>
  );
}
