import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { inr } from '../lib/api';
import { useCart } from '../context/CartContext';

export function ProductCard({ product, badge }) {
  const { addItem } = useCart();
  const mrp = Math.round(Number(product.price) * 1.28);
  const specs = product.specifications || {};
  const line = [specs.Processor, specs.RAM, specs.Storage].filter(Boolean).slice(0, 2).join(' · ');
  const out = product.status === 'OUT_OF_STOCK' || product.stock <= 0;

  return (
    <article className="shop-card">
      {badge && <span className="shop-card-badge">{badge}</span>}
      <Link to={`/shop/products/${product.id}`} className="shop-card-media">
        <img src={product.images?.[0] || '/favicon.svg'} alt={product.name} />
      </Link>
      <div className="shop-card-body">
        <div className="shop-card-meta">
          <span>{product.brand?.name || 'REFURBICON'}</span>
          <span className="shop-rating"><Star size={12} fill="currentColor" /> 4.6</span>
        </div>
        <Link to={`/shop/products/${product.id}`} className="shop-card-title">{product.name}</Link>
        {line && <p className="shop-card-specs">{line}</p>}
        <div className="shop-card-price">
          <strong>{inr(product.price)}</strong>
          <s>{inr(mrp)}</s>
        </div>
        <button
          type="button"
          className="btn btn-primary shop-card-btn"
          disabled={out}
          onClick={() => addItem(product)}
        >
          <ShoppingCart size={16} />
          {out ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
