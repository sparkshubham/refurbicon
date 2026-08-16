import { useEffect, useState } from 'react';
import { Modal } from '../components/ui';
import api, { inr, statusBadge } from '../lib/api';

export default function StaffSalesReview() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ rating: 7, bonusPercent: 2, reviewNotes: '', status: 'APPROVED' });

  async function load() {
    const { data } = await api.get('/staff/sales-review', { params: { month, year } });
    setRows(data.data.rows || []);
  }

  useEffect(() => { load().catch(console.error); }, [month, year]);

  function openReview(row) {
    setSelected(row);
    setForm({
      rating: row.bonus?.rating || 7,
      bonusPercent: row.bonus?.bonusPercent || 2,
      reviewNotes: row.bonus?.reviewNotes || '',
      status: row.bonus?.status === 'PAID' ? 'PAID' : 'APPROVED',
    });
    setOpen(true);
  }

  async function save() {
    await api.post('/staff/bonuses', {
      employeeId: selected.employee.id,
      month,
      year,
      rating: Number(form.rating),
      bonusPercent: Number(form.bonusPercent),
      reviewNotes: form.reviewNotes,
      status: form.status,
    });
    setOpen(false);
    load();
  }

  async function applyToPayroll() {
    if (!confirm('Apply all APPROVED bonuses to payroll for this month?')) return;
    const { data } = await api.post('/staff/bonuses/apply-payroll', { month, year });
    alert(`Updated ${data.data.length} payslip(s)`);
    load();
  }

  const previewBonus = selected
    ? Number(((Number(selected.paidAmount || 0) * Number(form.bonusPercent || 0)) / 100).toFixed(2))
    : 0;

  return (
    <div>
      <div className="toolbar">
        <div>
          <h2 className="brand-font" style={{ margin: 0 }}>Staff Sales Review</h2>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>Review sales performance and set monthly bonuses</p>
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
          <button className="btn btn-primary" onClick={applyToPayroll}>Apply bonuses to payroll</button>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Staff</th><th>Department</th><th>Orders</th><th>Sales</th>
              <th>Paid sales</th><th>Rating</th><th>Bonus</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employee.id}>
                <td style={{ fontWeight: 600 }}>{r.employee.firstName} {r.employee.lastName}</td>
                <td>{r.employee.department?.name || '—'}</td>
                <td>{r.salesCount}</td>
                <td>{inr(r.salesAmount)}</td>
                <td>{inr(r.paidAmount)}</td>
                <td>{r.bonus ? `${r.bonus.rating}/10` : '—'}</td>
                <td>{r.bonus ? inr(r.bonus.bonusAmount) : '—'}</td>
                <td>
                  {r.bonus
                    ? <span className={`badge ${statusBadge(r.bonus.status)}`}>{r.bonus.status}</span>
                    : <span className="badge">Pending review</span>}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openReview(r)}>Review</button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={9} className="empty">No staff with login linked. Link employees to users for sales attribution.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={selected ? `Review ${selected.employee.firstName} ${selected.employee.lastName}` : ''}
        onClose={() => setOpen(false)}
        onSubmit={save}
        submitLabel="Save review"
      >
        {selected && (
          <>
            <p style={{ color: 'var(--muted)' }}>
              {selected.salesCount} orders · Sales {inr(selected.salesAmount)} · Paid {inr(selected.paidAmount)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>Rating (1–10)</label>
                <input className="input" type="number" min={1} max={10} step={0.5} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Bonus % of paid sales</label>
                <input className="input" type="number" min={0} step={0.1} value={form.bonusPercent} onChange={(e) => setForm({ ...form, bonusPercent: e.target.value })} />
              </div>
            </div>
            <p style={{ textAlign: 'right' }}>Bonus preview: <strong>{inr(previewBonus)}</strong></p>
            <div className="form-group">
              <label>Status</label>
              <select className="select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="form-group">
              <label>Review notes</label>
              <textarea className="input" rows={3} value={form.reviewNotes} onChange={(e) => setForm({ ...form, reviewNotes: e.target.value })} />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
