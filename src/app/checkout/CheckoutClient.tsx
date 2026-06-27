'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import WhishModal from '@/components/WhishModal';
import styles from './CheckoutClient.module.css';

interface CheckoutClientProps {
  products: any[];
  settings: any;
}

export default function CheckoutClient({ products, settings }: CheckoutClientProps) {
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem, clearCart, totalUsd } = useCartStore();
  
  const [loading, setLoading] = useState(false);
  const [showWhishModal, setShowWhishModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [whatsappFallback, setWhatsappFallback] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    fulfillment: 'delivery' as 'delivery' | 'pickup',
    delivery_address: '',
    delivery_date: '',
    delivery_time: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item before sending your order.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          payment_method: 'whish',
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

      // Save order number for the success page
      setOrderNumber(result.orderNumber);

      // Open WhatsApp
      const whatsappNum = settings?.whatsapp_number || '96176585028';
      const itemLines = items.map(i => `- ${i.name} x${i.quantity}`).join('\n');
      
      const message = [
        "Hello Rebelly's, I would like to place an order:",
        '',
        itemLines,
        '',
        `Name: ${formData.customer_name}`,
        `Phone: ${formData.customer_phone}`,
        `Fulfillment: ${formData.fulfillment}`,
        formData.delivery_address ? `Area/address: ${formData.delivery_address}` : 'Area/address: To be confirmed',
        formData.delivery_date ? `Requested date: ${formData.delivery_date}` : 'Date: As soon as possible',
        formData.delivery_time ? `Preferred time: ${formData.delivery_time}` : '',
        formData.notes ? `Notes: ${formData.notes}` : 'Notes: None',
        '',
        'Please confirm availability, final price, delivery fee, and payment method.'
      ].filter(l => l !== '').join('\n');

      const waUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`;
      const waWindow = window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (!waWindow) setWhatsappFallback(waUrl);

      // Store order snapshot before clearing cart
      const snapshot = {
        orderNumber: result.orderNumber,
        items: items.map(i => ({ name: i.name, quantity: i.quantity })),
        paymentMethod: 'whish',
        customerName: formData.customer_name,
        fulfillment: formData.fulfillment,
        deliveryDate: formData.delivery_date,
        deliveryTime: formData.delivery_time,
      };
      sessionStorage.setItem('rebellys_order_snapshot', JSON.stringify(snapshot));

      setShowWhishModal(true);
      setLoading(false);
      
    } catch (err: any) {
      alert(err.message || 'Failed to submit order. Please try again.');
      setLoading(false);
    }
  };

  const closeWhishModal = () => {
    setShowWhishModal(false);
    clearCart();
    router.push(`/checkout/success?order=${orderNumber}`);
  };

  return (
    <main className="main-site checkout-page">
      <section className={styles.checkoutHero}>
        <div className={`container ${styles.checkoutHeroInner}`}>
          <div>
            <h1 className="section-title">Build Your <em>Flower Order</em></h1>
            <p className="section-subtitle" style={{ maxWidth: '680px' }}>
              Choose from Rebelly's current collections, add delivery or pickup details, and send the order to WhatsApp. The shop confirms freshness, price, delivery fee, and local payment method before preparing it.
            </p>
          </div>
          <div className={styles.checkoutNote}>
            <strong>Order Process</strong>
            <span>1. Build your order here</span>
            <span>2. Send request via WhatsApp</span>
            <span>3. Confirm details & pay</span>
            <span>4. Flowers are arranged & sent!</span>
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
                      <span>Price confirmed by WhatsApp</span>
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
                {loading ? <span className="spinner"></span> : 'Send via WhatsApp'}
              </button>
              {whatsappFallback && (
                <p style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Popup blocked.{' '}
                  <a href={whatsappFallback} target="_blank" rel="noopener noreferrer">
                    Tap here to send via WhatsApp
                  </a>
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      <WhishModal
        isOpen={showWhishModal}
        onClose={closeWhishModal}
        settings={settings || { whish_number: '96176585028', lbp_rate: '89500', whatsapp_number: '96176585028', shop_phone: '96176585028' }}
        totalUsd={0}
        orderNumber={orderNumber}
      />
    </main>
  );
}
