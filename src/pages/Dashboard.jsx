import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { inr } from '../lib/api';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data.data)).catch(console.error);
  }, []);

  if (!data) return <div className="loading">Loading dashboard...</div>;
  const { kpis, salesOverview, hr, attendanceOverview } = data;

  const cards = [
    { label: "Today's Sales", value: inr(kpis.todaySales), delta: `${kpis.salesChange}% vs yesterday`, up: kpis.salesChange >= 0 },
    { label: "Today's Orders", value: kpis.todayOrders },
    { label: 'Pending Orders', value: kpis.pendingOrders },
    { label: 'Total Products', value: kpis.totalProducts },
    { label: 'Low Stock', value: kpis.lowStock },
    { label: 'Out of Stock', value: kpis.outOfStock },
    { label: 'Total Customers', value: kpis.totalCustomers },
    { label: 'Stock Value', value: inr(kpis.stockValue) },
  ];

  return (
    <div>
      <div className="kpi-grid">
        {cards.map((c) => (
          <div className="card kpi" key={c.label}>
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
            {c.delta && <div className={`delta ${c.up ? 'up' : 'down'}`}>{c.delta}</div>}
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <h3 className="section-title">Sales Overview</h3>
          <p className="section-sub">Revenue trend for recent months</p>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesOverview.length ? salesOverview : [{ month: 'Now', total: 0 }]}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0056b3" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0056b3" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip formatter={(v) => inr(v)} />
                <Area type="monotone" dataKey="total" stroke="#0056b3" fill="url(#salesFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="section-title">Attendance Overview</h3>
          <p className="section-sub">Today’s workforce snapshot</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendanceOverview} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {attendanceOverview.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid-hr">
            <div className="stat-mini"><div className="n">{hr.totalEmployees}</div><div className="l">Employees</div></div>
            <div className="stat-mini"><div className="n" style={{ color: 'var(--success)' }}>{hr.present}</div><div className="l">Present</div></div>
            <div className="stat-mini"><div className="n" style={{ color: 'var(--danger)' }}>{hr.absent}</div><div className="l">Absent</div></div>
            <div className="stat-mini"><div className="n" style={{ color: 'var(--warning)' }}>{hr.onLeave}</div><div className="l">On Leave</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
