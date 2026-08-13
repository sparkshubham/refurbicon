import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { fmtDate, inr, statusBadge } from '../lib/api';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [tab, setTab] = useState('specs');
  const [serial, setSerial] = useState('');

  async function load() {
    const { data } = await api.get(`/products/${id}`);
    setProduct(data.data);
  }

  useEffect(() => { load().catch(console.error); }, [id]);

  async function addSerial() {
    if (!serial.trim()) return;
    await api.post(`/products/${id}/serials`, { serial });
    setSerial('');
    load();
  }

  if (!product) return <div className="loading">Loading product...</div>;
  const specs = product.specifications || {};
  const qc = product.qcDetails || {};

  return (
    <div>
      <div className="toolbar">
        <Link className="btn btn-ghost" to="/products">← Back</Link>
      </div>
      <div className="card card-pad">
        <div className="product-gallery">
          <img className="product-main-img" src={product.images?.[0] || 'https://placehold.co/800x600?text=Product'} alt="" />
          <div>
            <div className="detail-header">
              <div>
                <h2 className="brand-font" style={{ margin: 0 }}>{product.name}</h2>
                <p style={{ color: 'var(--muted)', margin: '6px 0' }}>{product.sku} · {product.condition}</p>
                <span className={`badge ${statusBadge(product.status)}`}>{product.status.replaceAll('_', ' ')}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{inr(product.price)}</div>
            </div>
            <div className="spec-grid" style={{ marginTop: 16 }}>
              <div className="spec-item"><span>Brand</span><strong>{product.brand?.name || '—'}</strong></div>
              <div className="spec-item"><span>Category</span><strong>{product.category?.name || '—'}</strong></div>
              <div className="spec-item"><span>Warranty</span><strong>{product.warrantyMonths} months</strong></div>
              <div className="spec-item"><span>Stock</span><strong>{product.stock}</strong></div>
            </div>
          </div>
        </div>

        <div className="tabs" style={{ marginTop: 22 }}>
          {['specs', 'serials', 'images', 'qc', 'history'].map((t) => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'specs' ? 'Specifications' : t === 'serials' ? 'Serial Numbers' : t === 'qc' ? 'QC Details' : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'specs' && (
          <div className="spec-grid">
            {Object.entries(specs).map(([k, v]) => (
              <div className="spec-item" key={k}><span>{k}</span><strong>{String(v)}</strong></div>
            ))}
            {!Object.keys(specs).length && <div className="empty">No specifications</div>}
          </div>
        )}

        {tab === 'serials' && (
          <div>
            <div className="toolbar">
              <input className="input" placeholder="Add serial number" value={serial} onChange={(e) => setSerial(e.target.value)} />
              <button className="btn btn-primary" onClick={addSerial}>Add Serial</button>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Serial</th><th>Status</th><th>Added</th></tr></thead>
                <tbody>
                  {(product.serialNumbers || []).map((s) => (
                    <tr key={s.id}><td>{s.serial}</td><td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td><td>{fmtDate(s.createdAt)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'images' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(product.images || []).map((src) => <img key={src} src={src} alt="" style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 10 }} />)}
            {!product.images?.length && <div className="empty">No images</div>}
          </div>
        )}

        {tab === 'qc' && (
          <div className="spec-grid">
            {Object.entries(qc).map(([k, v]) => (
              <div className="spec-item" key={k}><span>{k}</span><strong>{String(v)}</strong></div>
            ))}
            {!Object.keys(qc).length && <div className="empty">No QC details</div>}
          </div>
        )}

        {tab === 'history' && (
          <ul className="timeline">
            {(product.history || []).map((h) => (
              <li key={h.id} className="done">
                <div className="t-title">{h.action}</div>
                <div className="t-meta">{h.note} · {h.user?.name || 'System'} · {fmtDate(h.createdAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
