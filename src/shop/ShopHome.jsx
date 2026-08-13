import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Laptop, Monitor, Cpu, Printer, Smartphone, Headphones,
  ShieldCheck, RefreshCcw, Lock, CheckCircle2,
} from 'lucide-react';
import api from '../lib/api';
import { ProductCard } from './ProductCard';

const CATEGORIES = [
  { name: 'Laptop', icon: Laptop },
  { name: 'Desktop', icon: Cpu },
  { name: 'Monitor', icon: Monitor },
  { name: 'Accessory', icon: Headphones },
  { name: 'Mobile', icon: Smartphone },
  { name: 'Printer', icon: Printer },
];

const TRUST = [
  { icon: BadgeCheck, title: 'Professionally Tested', text: '45+ QC checkpoints' },
  { icon: ShieldCheck, title: '6 Months Warranty', text: 'Parts & labor covered' },
  { icon: RefreshCcw, title: 'Easy Returns', text: '7-day return window' },
  { icon: Lock, title: 'Secure Payment', text: 'COD & online checkout' },
];

export default function ShopHome() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/store/featured')
      .then(({ data }) => setFeatured(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="shop-hero">
        <div className="shop-hero-copy">
          <p className="shop-eyebrow">Refurbished Electronics</p>
          <h1 className="brand-font">Premium Refurbished Technology You Can Trust</h1>
          <p className="shop-hero-sub">
            Certified laptops, desktops, and monitors — tested, cleaned, and backed by warranty.
          </p>
          <div className="shop-hero-cta">
            <Link to="/shop/products" className="btn btn-primary shop-btn-lg">
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link to="/shop/products?category=Laptop" className="btn shop-btn-outline">
              Browse Laptops
            </Link>
          </div>
        </div>
        <div className="shop-hero-visual" aria-hidden>
          <img
            src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200"
            alt=""
          />
        </div>
      </section>

      <section className="shop-section shop-trust">
        {TRUST.map((t) => (
          <div key={t.title} className="shop-trust-item">
            <t.icon size={22} />
            <div>
              <strong>{t.title}</strong>
              <span>{t.text}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="shop-section">
        <div className="shop-section-head">
          <h2 className="brand-font">Shop by Category</h2>
          <Link to="/shop/products">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="shop-cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.name} to={`/shop/products?category=${encodeURIComponent(c.name)}`} className="shop-cat">
              <c.icon size={28} />
              <span>{c.name === 'Accessory' ? 'Accessories' : `${c.name}s`}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="shop-section">
        <div className="shop-section-head">
          <h2 className="brand-font">Featured Products</h2>
          <Link to="/shop/products">See more <ArrowRight size={16} /></Link>
        </div>
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="shop-product-grid">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} badge={i === 0 ? 'Best Seller' : i === 1 ? 'Popular' : null} />
            ))}
          </div>
        )}
      </section>

      <section className="shop-section shop-assurance">
        <div className="shop-assurance-card">
          <CheckCircle2 size={28} />
          <div>
            <h3 className="brand-font">Assured Quality on Every Device</h3>
            <p>Every unit is graded, data-wiped, and restored before it reaches you.</p>
          </div>
          <Link to="/shop/products" className="btn btn-primary">Explore deals</Link>
        </div>
      </section>
    </div>
  );
}
