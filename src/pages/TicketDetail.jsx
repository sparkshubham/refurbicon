import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { fmtDate, statusBadge } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isStaff = user?.role?.name === 'Staff';
  const [ticket, setTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [comment, setComment] = useState('');

  async function load() {
    const { data } = await api.get(`/tickets/${id}`);
    setTicket(data.data);
  }

  useEffect(() => {
    load().catch(console.error);
    if (!isStaff) {
      api.get('/users').then((r) => setUsers(r.data.data || [])).catch(() => {});
    }
  }, [id, isStaff]);

  async function patch(body) {
    await api.patch(`/tickets/${id}`, body);
    load();
  }

  async function addComment() {
    if (!comment.trim()) return;
    await api.post(`/tickets/${id}/comments`, { body: comment });
    setComment('');
    load();
  }

  if (!ticket) return <div className="loading">Loading ticket...</div>;

  return (
    <div>
      <div className="toolbar">
        <Link className="btn btn-ghost" to="/tickets">← Back</Link>
        <div className="toolbar-right">
          <select className="select" value={ticket.priority} onChange={(e) => patch({ priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className="select" value={ticket.status} onChange={(e) => patch({ status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </select>
          {!isStaff && (
            <select
              className="select"
              value={ticket.assignedToId || ''}
              onChange={(e) => patch({ assignedToId: e.target.value || null })}
            >
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="detail-header">
          <div>
            <h2 className="brand-font" style={{ margin: 0 }}>{ticket.ticketNo}</h2>
            <p style={{ margin: '6px 0 0' }}>{ticket.subject}</p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{fmtDate(ticket.createdAt)} · {ticket.category}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className={`badge ${statusBadge(ticket.priority)}`}>{ticket.priority}</span>
            <span className={`badge ${statusBadge(ticket.status)}`}>{ticket.status.replaceAll('_', ' ')}</span>
          </div>
        </div>
        <div className="spec-grid" style={{ marginTop: 14 }}>
          <div className="spec-item"><span>Customer</span><strong>{ticket.customer?.name || '—'}</strong></div>
          <div className="spec-item"><span>Order</span><strong>{ticket.order?.orderNo || '—'}</strong></div>
          <div className="spec-item"><span>Created by</span><strong>{ticket.createdBy?.name || '—'}</strong></div>
          <div className="spec-item"><span>Assignee</span><strong>{ticket.assignedTo?.name || 'Unassigned'}</strong></div>
        </div>
        {ticket.description && (
          <p style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
        )}
      </div>

      <div className="card card-pad">
        <h3 className="section-title">Comments</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {(ticket.comments || []).map((c) => (
            <div key={c.id} style={{ padding: 12, background: 'var(--bg)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong>{c.user?.name || 'User'}</strong>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtDate(c.createdAt)}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{c.body}</div>
            </div>
          ))}
          {!ticket.comments?.length && <div className="empty" style={{ padding: 16 }}>No comments yet</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addComment()}
          />
          <button className="btn btn-primary" onClick={addComment}>Reply</button>
        </div>
      </div>
    </div>
  );
}
