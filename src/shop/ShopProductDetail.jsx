import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ShoppingBag, ShoppingCart, Star } from 'lucide-react';
import api, { inr } from '../lib/api';
import { useCart } from '../context/CartContext';

export default function ShopProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api.get(`/store/products/${id}`)
      .then(({ data }) => {
        setProduct(data.data);
        setActiveImg(0);
      })
      .catch((e) => setError(e.response?.data?.message || 'Product not found'));
  }, [id]);

  if (error) return <div className="empty">{error}</div>;
  if (!product) return <div className="loading">Loading product...</div>;

  const images = product.images?.length ? product.images : ['/favicon.svg'];
  const mrp = Math.round(Number(product.price) * 1.28);
  const specs = product.specifications || {};
  const qc = product.qcDetails || {};
  const out = product.status === 'OUT_OF_STOCK' || product.stock <= 0;

  function buyNow() {
    addItem(product);
    navigate('/shop/cart');
  }

  return (
    <div className="shop-detail">
      <div className="shop-breadcrumb">
        <Link to="/shop">Home</Link>
        <span>/</span>
        <Link to="/shop/products">Products</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="shop-detail-grid">
        <div className="shop-gallery">
          <div className="shop-gallery-main">
            <img src={images[activeImg]} alt={product.name} />
          </div>
          <div className="shop-thumbs">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                className={i === activeImg ? 'active' : ''}
                onClick={() => setActiveImg(i)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="shop-detail-info">
          <p className="shop-eyebrow">{product.brand?.name} · {product.category?.name}</p>
          <h1 className="brand-font">{product.name}</h1>
          <div className="shop-detail-rating">
            <Star size={16} fill="currentColor" /> 4.6 · SKU {product.sku}
          </div>
          <div className="shop-detail-price">
            <strong>{inr(product.price)}</strong>
            <s>{inr(mrp)}</s>
            <span className={`badge ${out ? 'badge-red' : 'badge-green'}`}>
              {out ? 'Out of Stock' : 'In Stock'}
            </span>
          </div>

          <ul className="shop-highlights">
            <li><Check size={16} /> Condition: {product.condition}</li>
            <li><Check size={16} /> Warranty: {product.warrantyMonths} months</li>
            <li><Check size={16} /> Professionally tested & data wiped</li>
            {specs.Processor && <li><Check size={16} /> {specs.Processor}</li>}
            {specs.RAM && <li><Check size={16} /> {specs.RAM} RAM</li>}
          </ul>

          <div className="shop-detail-actions">
            <button type="button" className="btn btn-primary shop-btn-lg" disabled={out} onClick={() => addItem(product)}>
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button type="button" className="btn shop-btn-outline shop-btn-lg" disabled={out} onClick={buyNow}>
              <ShoppingBag size={18} /> Buy Now
            </button>
          </div>
        </div>
      </div>

      <div className="shop-detail-panels">
        <section className="shop-panel">
          <h2 className="brand-font">Specifications</h2>
          <div className="spec-grid">
            {Object.entries(specs).map(([k, v]) => (
              <div className="spec-item" key={k}>
                <span>{k}</span>
                <strong>{String(v)}</strong>
              </div>
            ))}
            {!Object.keys(specs).length && <p className="empty">No specifications listed.</p>}
          </div>
        </section>

        <section className="shop-panel">
          <h2 className="brand-font">What&apos;s in the box</h2>
          <ul className="shop-checklist">
            <li><Check size={16} /> Device unit</li>
            <li><Check size={16} /> Power adapter / charger</li>
            <li><Check size={16} /> Quick start guide</li>
            <li><Check size={16} /> Warranty card</li>
          </ul>
        </section>

        <section className="shop-panel">
          <h2 className="brand-font">Assured Quality</h2>
          <ul className="shop-checklist">
            {Object.entries(qc).map(([k, v]) => (
              <li key={k}><Check size={16} /> {k}: {String(v)}</li>
            ))}
            {!Object.keys(qc).length && (
              <>
                <li><Check size={16} /> Display & keyboard checked</li>
                <li><Check size={16} /> Battery health verified</li>
                <li><Check size={16} /> Ports & connectivity tested</li>
              </>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
