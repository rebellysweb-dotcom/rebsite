'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import Icon from '@/components/icons/Icon';
import styles from './CheckoutClient.module.css';

interface CheckoutClientProps {
  products: any[];
  settings: any;
}

export default function CheckoutClient({ products }: CheckoutClientProps) {
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    fulfillment: 'delivery' as 'delivery' | 'pickup',
    delivery_address: '',
    delivery_date: '',
    delivery_time: '',
    notes: '',
    card_message: '',
    payment_method: 'whish' as 'whish' | 'cash',
  });

  // Products not already in cart, shown as suggestions
  const cartIds = useMemo(() => new Set(items.map(i => i.id)), [items]);
  const suggestions = useMemo(
    () => products.filter(p => !cartIds.has(p.id)).slice(0, 3),
    [products, cartIds]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Please add at least one item to your order.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          card_message: formData.card_message,
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

      const result = (await response.json()) as { error?: string; orderNumber?: string };
      if (!response.ok) throw new Error(result.error || "Order failed");

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
      setError(err.message || 'We could not send your order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div>
            <p className={styles.eyebrow}>Order online</p>
            <h1 className={styles.title}>Build your <em>flower order</em></h1>
            <p className={styles.lede}>
              Pick your arrangements, add your details, and send the order. You will get a confirmation email, and our team will call or message to settle the final price.
            </p>
          </div>
          <ol className={styles.steps} aria-label="How ordering works">
            <li><span className={styles.stepIcon}><Icon name="bag" size={22} /></span>Add items to your order</li>
            <li><span className={styles.stepIcon}><Icon name="card" size={22} /></span>Fill in your details</li>
            <li><span className={styles.stepIcon}><Icon name="check" size={22} /></span>Send it and check your email</li>
            <li><span className={styles.stepIcon}><Icon name="truck" size={22} /></span>We arrange and deliver</li>
          </ol>
        </div>
      </header>

      <section className={styles.section}>
        <div className={`container ${styles.grid}`}>
          <div>
            <h2 className={styles.heading}>Select items</h2>
            <div className={styles.products}>
              {products.map((product) => (
                <article key={product.id} className={styles.product}>
                  <div className={styles.productMedia}>
                    {product.image_url && (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1280px) 340px, (min-width: 600px) 40vw, 92vw"
                        className={styles.productImg}
                      />
                    )}
                  </div>
                  <div className={styles.productBody}>
                    {product.tag && <span className={styles.tag}>{product.tag}</span>}
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productDesc}>{product.description}</p>
                    <p className={styles.productNote}>Price confirmed on WhatsApp</p>
                    <button type="button" className={`btn btn-primary ${styles.fullBtn}`} onClick={() => addItem(product)}>
                      <Icon name="plus" size={18} />
                      Add to order
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className={styles.panel} aria-label="Your order">
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Your order</h2>
              <button
                className={styles.textBtn}
                type="button"
                onClick={() => { if (window.confirm('Clear all items from your order?')) clearCart(); }}
              >
                <Icon name="trash" size={18} />
                Clear
              </button>
            </div>

            <div className={styles.cartItems}>
              {items.length === 0 ? (
                <p className={styles.empty}>Your order is empty. Add an arrangement to begin.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.cartName}>
                      <strong>{item.name}</strong>
                      <span>Price confirmed by the shop</span>
                    </div>
                    <div className={styles.qtyRow}>
                      <div className="qty-ctrl" role="group" aria-label={`Quantity for ${item.name}`}>
                        <button type="button" className="qty-btn" aria-label={`Decrease quantity of ${item.name}`} disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Icon name="minus" size={18} /></button>
                        <span className="qty-val" aria-live="polite">{item.quantity}</span>
                        <button type="button" className="qty-btn" aria-label={`Increase quantity of ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Icon name="plus" size={18} /></button>
                      </div>
                      <button type="button" className={styles.textBtn} aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}><Icon name="trash" size={18} />Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {suggestions.length > 0 && items.length > 0 && (
              <div className={styles.suggest}>
                <p className={styles.suggestLabel}>People also add</p>
                <div className={styles.suggestRow}>
                  {suggestions.map(p => (
                    <div key={p.id} className={styles.suggestCard}>
                      {p.image_url && (
                        <div className={styles.suggestMedia}>
                          <Image src={p.image_url} alt={p.name} fill sizes="140px" className={styles.productImg} />
                        </div>
                      )}
                      <p className={styles.suggestName}>{p.name}</p>
                      <button type="button" className={`btn btn-outline ${styles.suggestBtn}`} onClick={() => addItem(p)}>
                        <Icon name="plus" size={18} />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="customer_name">Full name <span className={styles.req}>required</span></label>
                <input id="customer_name" name="name" type="text" className={styles.input} required autoComplete="name"
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="customer_phone">Phone number, WhatsApp <span className={styles.req}>required</span></label>
                <input id="customer_phone" name="tel" type="tel" className={styles.input} required autoComplete="tel"
                  placeholder="+961 XX XXX XXX"
                  value={formData.customer_phone}
                  onChange={e => setFormData({ ...formData, customer_phone: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="customer_email">Email, for your confirmation</label>
                <input id="customer_email" name="email" type="email" className={styles.input} autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.customer_email}
                  onChange={e => setFormData({ ...formData, customer_email: e.target.value })} />
              </div>

              <fieldset className={styles.fieldset}>
                <legend className={styles.label}>Fulfillment <span className={styles.req}>required</span></legend>
                <div className={styles.choices}>
                  <div className={styles.choice}>
                    <input type="radio" id="f-delivery" name="fulfillment" value="delivery" checked={formData.fulfillment === 'delivery'}
                      onChange={() => setFormData({ ...formData, fulfillment: 'delivery' })} />
                    <label htmlFor="f-delivery"><Icon name="truck" size={18} />Delivery</label>
                  </div>
                  <div className={styles.choice}>
                    <input type="radio" id="f-pickup" name="fulfillment" value="pickup" checked={formData.fulfillment === 'pickup'}
                      onChange={() => setFormData({ ...formData, fulfillment: 'pickup' })} />
                    <label htmlFor="f-pickup"><Icon name="pin" size={18} />Store pickup</label>
                  </div>
                </div>
              </fieldset>

              {formData.fulfillment === 'delivery' && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="delivery_address">Delivery address or area <span className={styles.req}>required</span></label>
                  <input id="delivery_address" name="address" type="text" className={styles.input} required autoComplete="street-address"
                    placeholder="e.g. Zalka, near the church"
                    value={formData.delivery_address}
                    onChange={e => setFormData({ ...formData, delivery_address: e.target.value })} />
                </div>
              )}

              <fieldset className={styles.schedule}>
                <legend className={styles.scheduleLegend}>Schedule, optional</legend>
                <div className={styles.scheduleGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="delivery_date">Preferred date</label>
                    <input id="delivery_date" name="date" type="date" className={styles.input}
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      value={formData.delivery_date}
                      onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="delivery_time">Preferred time</label>
                    <select id="delivery_time" name="time" className={styles.input}
                      value={formData.delivery_time}
                      onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}>
                      <option value="">Any time</option>
                      <option value="Morning (9 AM – 12 PM)">Morning (9 AM – 12 PM)</option>
                      <option value="Afternoon (12 PM – 4 PM)">Afternoon (12 – 4 PM)</option>
                      <option value="Evening (4 PM – 8 PM)">Evening (4 – 8 PM)</option>
                    </select>
                  </div>
                </div>
                <p className={styles.hint}>Leave blank for the earliest delivery. The shop confirms the exact time on WhatsApp.</p>
              </fieldset>

              {items.some(i => i.id === 'addon-card') && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="card_message">Card message</label>
                  <textarea id="card_message" name="card_message" className={styles.input} rows={3} maxLength={160}
                    placeholder="Your message for the greeting card, up to 160 characters"
                    value={formData.card_message}
                    onChange={e => setFormData(f => ({ ...f, card_message: e.target.value }))} />
                  <p className={styles.hint}>{formData.card_message.length}/160</p>
                </div>
              )}

              <fieldset className={styles.fieldset}>
                <legend className={styles.label}>Payment method <span className={styles.req}>required</span></legend>
                <div className={styles.choices}>
                  <div className={styles.choice}>
                    <input type="radio" id="pm-whish" name="payment_method" value="whish" checked={formData.payment_method === 'whish'}
                      onChange={() => setFormData({ ...formData, payment_method: 'whish' })} />
                    <label htmlFor="pm-whish"><Icon name="phone" size={18} />Whish</label>
                  </div>
                  <div className={styles.choice}>
                    <input type="radio" id="pm-cash" name="payment_method" value="cash" checked={formData.payment_method === 'cash'}
                      onChange={() => setFormData({ ...formData, payment_method: 'cash' })} />
                    <label htmlFor="pm-cash"><Icon name="bag" size={18} />Cash</label>
                  </div>
                </div>
              </fieldset>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="notes">Special notes, optional</label>
                <textarea id="notes" name="notes" className={styles.input} rows={3}
                  placeholder="Colours, occasion, anything we should know"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              {error && <p className={styles.error} role="alert">{error}</p>}

              <button type="submit" className={`btn btn-primary ${styles.fullBtn} ${styles.submit}`} disabled={loading || items.length === 0}>
                {loading ? <span className="spinner" aria-label="Sending order" /> : (<>Place order<Icon name="arrow-right" size={18} motion="nudge" /></>)}
              </button>
              <p className={styles.hint}>
                You will receive a confirmation email. Our team will contact you to confirm the details.
              </p>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
