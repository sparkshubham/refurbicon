import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { inr, statusBadge } from '../lib/api';
import { Pagination, useListState } from '../components/ui';

export default function Payroll() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { page, setPage } = useListState();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const summary = meta?.summary || {};

  async function load() {
    const { data } = await api.get('/payroll', { params: { month, year, page, limit: 20 } });
    setRows(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load().catch(console.error); }, [month, year, page]);

  async function generate() {
    await api.post('/payroll/generate', { month, year });
    load();
  }

  async function payAll() {
    await api.patch('/payroll/pay-all', { month, year });
    load();
  }

  async function payOne(id) {
    await api.patch(`/payroll/${id}/pay`);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <select className="select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}</option>)}
          </select>
          <input className="input" style={{ minWidth: 100 }} type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={generate}>Generate Payroll</button>
          <button className="btn btn-primary" onClick={payAll}>Mark All Paid</button>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          ['Total Employees', summary.totalEmployees || 0],
          ['Paid Employees', summary.paidEmployees || 0],
          ['Total Payout', inr(summary.totalPayout || 0)],
          ['Average Salary', inr(summary.averageSalary || 0)],
          ['Pending Payments', summary.pendingPayments || 0],
        ].map(([l, v]) => (
          <div className="card kpi" key={l}><div className="label">{l}</div><div className="value">{v}</div></div>
        ))}
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Employee</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.employee?.firstName} {p.employee?.lastName}</td>
                <td>{inr(p.basicSalary)}</td>
                <td>{inr(Number(p.hra) + Number(p.conveyance) + Number(p.otherAllow) + Number(p.overtime))}</td>
                <td>{inr(p.totalDeductions)}</td>
                <td style={{ fontWeight: 700 }}>{inr(p.netSalary)}</td>
                <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                <td>
                  <div className="row-actions">
                    <Link className="btn btn-ghost btn-sm" to={`/payroll/${p.id}`}>Payslip</Link>
                    {p.status !== 'PAID' && (
                      <button className="btn btn-primary btn-sm" onClick={() => payOne(p.id)}>Mark Paid</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
    </div>
  );
}
