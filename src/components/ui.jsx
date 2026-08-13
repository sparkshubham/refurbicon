import { useState } from 'react';

export function Modal({ open, title, onClose, children, onSubmit, submitLabel = 'Save', wide }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <h3 className="brand-font">{title}</h3>
        {children}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          {onSubmit && (
            <button className="btn btn-primary" type="button" onClick={onSubmit}>{submitLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function useListState(initial = {}) {
  const [search, setSearch] = useState(initial.search || '');
  const [status, setStatus] = useState(initial.status || '');
  const [page, setPage] = useState(1);
  return { search, setSearch, status, setStatus, page, setPage };
}

export function Pagination({ meta, page, setPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
      <span style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: 14 }}>
        Page {meta.page} / {meta.pages}
      </span>
      <button className="btn btn-ghost btn-sm" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}
