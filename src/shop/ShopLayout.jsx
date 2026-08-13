import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Heart, Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

const NAV = [
  { to: '/shop/products?category=Laptop', label: 'Laptops' },
  { to: '/shop/products?category=Desktop', label: 'Desktops' },
  { to: '/shop/products?category=Monitor', label: 'Monitors' },
  { to: '/shop/products?category=Accessory', label: 'Accessories' },
  { to: '/shop/products?category=Mobile', label: 'Mobiles' },
  { to: '/shop/products', label: 'All Products' },
];

export default function ShopLayout() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  function onSearch(e) {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/shop/products?search=${encodeURIComponent(term)}` : '/shop/products');
  }

  return (
    <div className="shop">
      <header className="shop-header">
        <div className="shop-header-inner">
          <Link to="/shop" className="shop-brand">
            <span className="shop-logo">R</span>
            <span className="brand-font">REFURBICON</span>
          </Link>

          <form className="shop-search" onSubmit={onSearch}>
            <Search size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search laptops, desktops, monitors..."
              aria-label="Search products"
            />
          </form>

          <div className="shop-actions">
            <button type="button" className="shop-icon-btn" title="Wishlist" aria-label="Wishlist">
              <Heart size={20} />
            </button>
            <Link to="/shop/cart" className="shop-icon-btn shop-cart-btn" title="Cart">
              <ShoppingCart size={20} />
              {count > 0 && <span className="shop-cart-badge">{count}</span>}
            </Link>
            <Link to="/login" className="shop-icon-btn" title="Account">
              <User size={20} />
            </Link>
          </div>
        </div>

        <nav className="shop-nav">
          <div className="shop-nav-inner">
            {NAV.map((item) => (
              <NavLink key={item.label} to={item.to} className="shop-nav-link">
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="shop-main">
        <Outlet />
      </main>

      <footer className="shop-footer">
        <div className="shop-footer-inner">
          <div>
            <div className="shop-brand shop-brand-footer">
              <span className="shop-logo">R</span>
              <span className="brand-font">REFURBICON</span>
            </div>
            <p>Premium refurbished electronics — tested, warrantied, and ready to work.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/shop/products">All products</Link>
            <Link to="/shop/products?category=Laptop">Laptops</Link>
            <Link to="/shop/products?category=Monitor">Monitors</Link>
          </div>
          <div>
            <h4>Support</h4>
            <span>6 months warranty</span>
            <span>Easy returns</span>
            <span>support@refurbicon.com</span>
          </div>
        </div>
        <div className="shop-footer-bottom">© {new Date().getFullYear()} REFURBICON. All rights reserved.</div>
      </footer>
    </div>
  );
}
