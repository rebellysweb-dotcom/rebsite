'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import styles from './CheckoutClient.module.css';

interface CheckoutClientProps {
  products: any[];
  settings: any;
}

export default function CheckoutClient({ products }: CheckoutClientProps) {
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    fulfillment: 'delivery' as 'delivery' | 'pickup',
    delivery_address: '',
    delivery_date: '',
    delivery_time: '',
    notes: '',
    payment_method: 'whish' as 'whish' | 'cash',
  });

  // Products not already in cart — shown as suggestions
  const cartIds = useMemo(() => new Set(items.map(i => i.id)), [items]);
  const suggestions = useMemo(
    () => products.filter(p => !cartIds.has(p.id)).slice(0, 3),
    [products, cartIds]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item to your order.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            image_url: i.image_url,
            is_event_product: i.is_event_product,
            event_id: i.event_id ?? null,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      const snapshot = {
        orderNumber: result.orderNumber,
        items: items.map(i => ({ name: i.name, quantity: i.quantity })),
        paymentMethod: formData.payment_method,
        customerName: formData.customer_name,
        fulfillment: formData.fulfillment,
        deliveryDate: formData.delivery_date,
        deliveryTime: formData.delivery_time,
      };
      sessionStorage.setItem('rebellys_order_snapshot', JSON.stringify(snapshot));

      clearCart();
      router.push(`/checkout/success?order=${result.orderNumber}`);
    } catch (err: any) {
      alert(err.message || 'Failed to submit order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="main-site checkout-page">
      <section className={styles.checkoutHero}>
        <div className={`container ${styles.checkoutHeroInner}`}>
          <div>
            <h1 className="section-title">Build Your <em>Flower Order</em></h1>
            <p className="section-subtitle" style={{ maxWidth: '680px' }}>
              Choose your arrangements, fill in delivery details, and place your order — you'll receive a confirmation email and our team will be in touch to finalise everything.
            </p>
          </div>
          <div className={styles.checkoutNote}>
            <strong>Order Process</strong>
            <span>1. Add items to your order</span>
            <span>2. Fill in your details</span>
            <span>3. Place order — get email confirmation</span>
            <span>4. Flowers arranged &amp; delivered!</span>
          </div>
        </div>
      </section>

      <section className={styles.checkoutSection}>
        <div className={`container ${styles.checkoutGrid}`}>
          {/* Products Grid (Left) */}
          <div className={styles.checkoutItemsCol}>
            <h2 className={styles.checkoutHeading}>Select Items</h2>
            <div className={styles.checkoutProducts}>
              {products.map((product) => (
                <article key={product.id} className={styles.checkoutProduct}>
                  {product.image_url && <img src={product.image_url} alt={product.name} loading="lazy" />}
                  <div className={styles.checkoutProductBody}>
                    <span className="card-tag" style={{ display: 'inline-block', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--rose-500)', background: 'rgba(233,30,140,.08)', padding: '3px 10px', borderRadius: 'var(--radius-xl)', marginBottom: '10px' }}>
                      {product.tag}
                    </span>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <small>Price confirmed by WhatsApp</small>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => addItem(product)}
                    >
                      Add
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Cart Panel (Right) */}
          <div className={styles.cartPanel}>
            <div className={styles.cartPanelHeader}>
              <h2 className={styles.checkoutHeading} style={{ marginBottom: 0 }}>Your Order</h2>
              <button className={styles.cartClear} type="button" onClick={() => { if (window.confirm('Clear all items from your order?')) clearCart(); }}>Clear</button>
            </div>
            
            <div className={styles.cartItems}>
              {items.length === 0 ? (
                <p className={styles.cartEmpty}>Your order is empty. Add one or more flower collections to begin.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>Price confirmed by shop</span>
                    </div>
                    <div className="qty-ctrl">
                      <button type="button" className="qty-btn" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button type="button" className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      <button type="button" className="qty-btn" aria-label="Remove item" onClick={() => removeItem(item.id)}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Product suggestions */}
            {suggestions.length > 0 && items.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--rose-500)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px' }}>
                  People also add
                </p>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {suggestions.map(p => (
                    <div key={p.id} style={{ minWidth: '130px', background: 'var(--surface-alt, #fdf6f9)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(233,30,140,.1)', flexShrink: 0 }}>
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '72px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} loading="lazy" />
                      )}
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>{p.name}</p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '6px 0', justifyContent: 'center' }}
                        onClick={() => addItem(p)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.checkoutForm}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="customer_name">Full Name <span className="required">*</span></label>
                <input
                  id="customer_name"
                  type="text"
                  className="form-input"
                  required
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="customer_phone">Phone Number (WhatsApp) <span className="required">*</span></label>
                <input
                  id="customer_phone"
                  type="tel"
                  className="form-input"
                  required
                  autoComplete="tel"
                  placeholder="+961 XX XXX XXX"
                  value={formData.customer_phone}
                  onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="customer_email">Email (for order confirmation)</label>
                <input
                  id="customer_email"
                  type="email"
                  className="form-input"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.customer_email}
                  onChange={e => setFormData({ ...formData, customer_email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Fulfillment <span className="required">*</span></label>
                <div className="radio-group">
                  <div className="radio-pill">
                    <input 
                      type="radio" 
                      id="f-delivery" 
                      name="fulfillment" 
                      value="delivery" 
                      checked={formData.fulfillment === 'delivery'}
                      onChange={() => setFormData({ ...formData, fulfillment: 'delivery' })}
                    />
                    <label htmlFor="f-delivery">Delivery</label>
                  </div>
                  <div className="radio-pill">
                    <input 
                      type="radio" 
                      id="f-pickup" 
                      name="fulfillment" 
                      value="pickup" 
                      checked={formData.fulfillment === 'pickup'}
                      onChange={() => setFormData({ ...formData, fulfillment: 'pickup' })}
                    />
                    <label htmlFor="f-pickup">Store Pickup</label>
                  </div>
                </div>
              </div>

              {formData.fulfillment === 'delivery' && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="delivery_address">Delivery Address / Area</label>
                  <input
                    id="delivery_address"
                    type="text"
                    className="form-input"
                    required={true}
                    placeholder="e.g. Zalka, near the church..."
                    value={formData.delivery_address}
                    onChange={e => setFormData({ ...formData, delivery_address: e.target.value })}
                  />
                </div>
              )}

              {/* Scheduling */}
              <div style={{ marginBottom: '16px', padding: '14px 16px', background: 'rgba(233,30,140,.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(233,30,140,.1)' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--rose-700)', marginBottom: '12px', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  📅 Schedule (optional)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="delivery_date">Preferred Date</label>
                    <input
                      id="delivery_date"
                      type="date"
                      className="form-input"
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      value={formData.delivery_date}
                      onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="delivery_time">Preferred Time</label>
                    <select
                      id="delivery_time"
                      className="form-input"
                      value={formData.delivery_time}
                      onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                    >
                      <option value="">Any time</option>
                      <option value="Morning (9 AM – 12 PM)">Morning (9 AM – 12 PM)</option>
                      <option value="Afternoon (12 PM – 4 PM)">Afternoon (12 – 4 PM)</option>
                      <option value="Evening (4 PM – 8 PM)">Evening (4 – 8 PM)</option>
                    </select>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Leave blank for ASAP delivery. The shop will confirm the exact time via WhatsApp.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Payment Method <span className="required">*</span></label>
                <div className="radio-group">
                  <div className="radio-pill">
                    <input
                      type="radio"
                      id="pm-whish"
                      name="payment_method"
                      value="whish"
                      checked={formData.payment_method === 'whish'}
                      onChange={() => setFormData({ ...formData, payment_method: 'whish' })}
                    />
                    <label htmlFor="pm-whish">📱 Whish</label>
                  </div>
                  <div className="radio-pill">
                    <input
                      type="radio"
                      id="pm-cash"
                      name="payment_method"
                      value="cash"
                      checked={formData.payment_method === 'cash'}
                      onChange={() => setFormData({ ...formData, payment_method: 'cash' })}
                    />
                    <label htmlFor="pm-cash">💵 Cash</label>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="notes">Special Notes (Optional)</label>
                <textarea
                  id="notes"
                  className="form-textarea"
                  rows={3}
                  placeholder="Card message, special colors, etc."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1rem' }} disabled={loading || items.length === 0}>
                {loading ? <span className="spinner"></span> : 'Place Order'}
              </button>
              <p style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                You'll receive a confirmation email. Our team will contact you to confirm details.
              </p>
            </form>
          </div>
        </div>
      </section>

    </main>
  );
}
