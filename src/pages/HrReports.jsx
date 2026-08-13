import { useEffect, useState } from 'react';
import api, { inr } from '../lib/api';

export default function HrReports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/reports/hr').then((r) => setData(r.data.data)); }, []);
  if (!data) return <div className="loading">Loading HR reports...</div>;

  return (
    <div className="grid-2">
      <div className="card card-pad">
        <h3 className="section-title">Employees by Status</h3>
        {(data.employees || []).map((e) => (
          <div key={e.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span>{e.status}</span><strong>{e._count}</strong>
          </div>
        ))}
      </div>
      <div className="card card-pad">
        <h3 className="section-title">Attendance Today</h3>
        {(data.attendanceToday || []).map((e) => (
          <div key={e.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span>{e.status.replaceAll('_', ' ')}</span><strong>{e._count}</strong>
          </div>
        ))}
      </div>
      <div className="card card-pad">
        <h3 className="section-title">Leave Requests</h3>
        {(data.leaves || []).map((e) => (
          <div key={e.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span>{e.status}</span><strong>{e._count}</strong>
          </div>
        ))}
      </div>
      <div className="card kpi">
        <div className="label">Payroll This Month</div>
        <div className="value">{inr(data.payrollThisMonth)}</div>
      </div>
    </div>
  );
}
