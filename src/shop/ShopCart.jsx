import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import api, { inr } from '../lib/api';
import { useCart } from '../context/CartContext';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  paymentMethod: 'COD',
};

export default function ShopCart() {
  const { items, count, subtotal, setQty, removeItem, clear } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const delivery = subtotal >= 25000 || subtotal === 0 ? 0 : 199;
  const discount = 0;
  const total = subtotal + delivery - discount;

  async function placeOrder(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/store/checkout', {
        ...form,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setOrder(data.data);
      clear();
      setCheckout(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <div className="shop-success">
        <h1 className="brand-font">Order placed</h1>
        <p>Thanks {order.customer?.name}. Your order <strong>{order.orderNo}</strong> is confirmed.</p>
        <p className="shop-success-total">Total paid / due: {inr(order.totalAmount)}</p>
        <div className="shop-hero-cta">
          <Link to="/shop/products" className="btn btn-primary">Continue shopping</Link>
          <Link to="/shop" className="btn shop-btn-outline">Back to home</Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="empty shop-empty-cart">
        <h2 className="brand-font">Your cart is empty</h2>
        <p>Browse refurbished deals and add items to get started.</p>
        <Link to="/shop/products" className="btn btn-primary">Shop products</Link>
      </div>
    );
  }

  return (
    <div className="shop-cart">
      <div className="shop-breadcrumb">
        <Link to="/shop">Home</Link>
        <span>/</span>
        <span>Cart</span>
      </div>

      <div className="shop-cart-layout">
        <div className="shop-cart-list">
          <h1 className="brand-font">Shopping Cart</h1>
          {items.map((item) => (
            <div className="shop-cart-row" key={item.productId}>
              <img src={item.image || '/favicon.svg'} alt="" />
              <div className="shop-cart-info">
                <Link to={`/shop/products/${item.productId}`}>{item.name}</Link>
                <span>{item.brand} · {item.sku}</span>
                <strong>{inr(item.price)}</strong>
              </div>
              <div className="shop-qty">
                <button type="button" onClick={() => setQty(item.productId, item.quantity - 1)} aria-label="Decrease">
                  <Minus size={14} />
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => setQty(item.productId, item.quantity + 1)} aria-label="Increase">
                  <Plus size={14} />
                </button>
              </div>
              <div className="shop-cart-line">{inr(item.price * item.quantity)}</div>
              <button type="button" className="shop-icon-btn" onClick={() => removeItem(item.productId)} aria-label="Remove">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <aside className="shop-summary">
          <h2 className="brand-font">My Cart ({count})</h2>
          <div className="shop-summary-row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="shop-summary-row"><span>Discount</span><span>{inr(discount)}</span></div>
          <div className="shop-summary-row"><span>Delivery</span><span>{delivery ? inr(delivery) : 'FREE'}</span></div>
          <div className="shop-summary-total"><span>Total</span><strong>{inr(total)}</strong></div>
          {!checkout ? (
            <button type="button" className="btn btn-primary shop-btn-lg" style={{ width: '100%' }} onClick={() => setCheckout(true)}>
              Proceed to Checkout
            </button>
          ) : (
            <form className="shop-checkout-form" onSubmit={placeOrder}>
              {error && <div className="error-text">{error}</div>}
              {['name', 'phone', 'email', 'address', 'city', 'state', 'pincode'].map((k) => (
                <div className="form-group" key={k}>
                  <label style={{ textTransform: 'capitalize' }}>{k}{['name', 'phone', 'address'].includes(k) ? ' *' : ''}</label>
                  <input
                    className="input"
                    required={['name', 'phone', 'address'].includes(k)}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Payment</label>
                <select
                  className="select"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  style={{ width: '100%', minWidth: 0 }}
                >
                  <option value="COD">Cash on Delivery</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary shop-btn-lg" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Placing order...' : `Place order · ${inr(total)}`}
              </button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
