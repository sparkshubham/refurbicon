import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { fmtDay, inr } from '../lib/api';

export default function Payslip() {
  const { id } = useParams();
  const [p, setP] = useState(null);

  useEffect(() => {
    api.get(`/payroll/${id}`).then((r) => setP(r.data.data));
  }, [id]);

  if (!p) return <div className="loading">Loading payslip...</div>;
  const emp = p.employee;

  return (
    <div>
      <div className="toolbar">
        <Link className="btn btn-ghost" to="/payroll">← Back</Link>
        <button className="btn btn-primary" onClick={() => window.print()}>Print Payslip</button>
      </div>
      <div className="payslip">
        <div className="payslip-head">
          <div>
            <h2 className="brand-font" style={{ margin: 0, color: 'var(--primary)' }}>REFURBICON</h2>
            <div style={{ color: 'var(--muted)' }}>Tech Park, Bengaluru, India</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Payslip</strong>
            <div>{new Date(2000, p.month - 1, 1).toLocaleString('en', { month: 'long' })} {p.year}</div>
          </div>
        </div>
        <div className="payslip-grid" style={{ marginBottom: 18 }}>
          <div>
            <div><strong>{emp?.firstName} {emp?.lastName}</strong></div>
            <div style={{ color: 'var(--muted)' }}>{emp?.employeeNo} · {emp?.designation}</div>
            <div style={{ color: 'var(--muted)' }}>{emp?.department?.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>Email: {emp?.email}</div>
            <div>Generated: {fmtDay(p.createdAt)}</div>
            <div>Status: {p.status}</div>
          </div>
        </div>
        <div className="payslip-grid">
          <div className="card card-pad">
            <h4>Earnings</h4>
            {[
              ['Basic Salary', p.basicSalary],
              ['HRA', p.hra],
              ['Conveyance', p.conveyance],
              ['Overtime', p.overtime],
              ['Other Allowances', p.otherAllow],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{l}</span><span>{inr(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, fontWeight: 700 }}>
              <span>Gross</span><span>{inr(p.grossEarnings)}</span>
            </div>
          </div>
          <div className="card card-pad">
            <h4>Deductions</h4>
            {[
              ['PF', p.pf],
              ['Professional Tax', p.professionalTax],
              ['ESI', p.esi],
              ['Leave Deduction', p.leaveDeduction],
              ['Other', p.otherDeduction],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{l}</span><span>{inr(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, fontWeight: 700 }}>
              <span>Total Deductions</span><span>{inr(p.totalDeductions)}</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 18, padding: 16, background: 'var(--primary-soft)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Net Salary</strong>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{inr(p.netSalary)}</span>
        </div>
      </div>
    </div>
  );
}
