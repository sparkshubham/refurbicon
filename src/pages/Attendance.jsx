import { useEffect, useState } from 'react';
import api, { fmtDay, fmtTime, statusBadge } from '../lib/api';
import { Pagination, useListState } from '../components/ui';

export default function Attendance() {
  const { page, setPage, status, setStatus } = useListState();
  const [tab, setTab] = useState('today');
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState({});
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function loadToday() {
    const { data } = await api.get('/attendance/today');
    setRows(data.data);
    setStats(data.meta?.stats || {});
  }

  async function loadHistory() {
    const { data } = await api.get('/attendance', {
      params: {
        page,
        limit: 20,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      },
    });
    setHistory(data.data);
    setMeta(data.meta);
  }

  useEffect(() => {
    if (tab === 'today') loadToday().catch(console.error);
  }, [tab]);

  useEffect(() => {
    if (tab === 'history') loadHistory().catch(console.error);
  }, [tab, page, status, from, to]);

  async function mark(employeeId, next) {
    await api.post('/attendance/mark', { employeeId, status: next });
    loadToday();
  }

  return (
    <div>
      <div className="tabs">
        <button className={`tab${tab === 'today' ? ' active' : ''}`} onClick={() => setTab('today')}>Today</button>
        <button className={`tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>History</button>
      </div>

      {tab === 'today' && (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              ['Present', stats.present, 'var(--success)'],
              ['Late', stats.late, 'var(--warning)'],
              ['Absent', stats.absent, 'var(--danger)'],
              ['On Leave', stats.onLeave, 'var(--info)'],
            ].map(([l, n, c]) => (
              <div className="card kpi" key={l}>
                <div className="label">{l} Today</div>
                <div className="value" style={{ color: c }}>{n || 0}</div>
              </div>
            ))}
          </div>
          <div className="card table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Employee</th><th>ID</th><th>Department</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employeeId}>
                    <td style={{ fontWeight: 600 }}>{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td>{r.employee?.employeeNo}</td>
                    <td>{r.employee?.department?.name || '—'}</td>
                    <td>{fmtTime(r.checkIn)}</td>
                    <td>{fmtTime(r.checkOut)}</td>
                    <td>{r.workingHours ?? '—'}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status.replaceAll('_', ' ')}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => mark(r.employeeId, 'PRESENT')}>Present</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => mark(r.employeeId, 'ABSENT')}>Absent</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => mark(r.employeeId, 'ON_LEAVE')}>Leave</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <input className="input" type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
              <input className="input" type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
              <select className="select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
                <option value="">All Status</option>
                {['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE', 'HALF_DAY'].map((s) => (
                  <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th><th>Employee</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDay(r.date)}</td>
                    <td>{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td>{fmtTime(r.checkIn)}</td>
                    <td>{fmtTime(r.checkOut)}</td>
                    <td>{r.workingHours ?? '—'}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status.replaceAll('_', ' ')}</span></td>
                  </tr>
                ))}
                {!history.length && <tr><td colSpan={6} className="empty">No attendance records</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} page={page} setPage={setPage} />
        </>
      )}
    </div>
  );
}
