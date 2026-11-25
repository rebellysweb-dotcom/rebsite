'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { formatUsd } from '@/lib/utils';
import { SHOP, telHref, whatsappHref } from '@/lib/shop';
import { GOOGLE, HOURS_LABEL, DELIVERY_NOTE } from '@/lib/storefront';
import AddOnPicker from '@/components/AddOnPicker';
import styles from './CheckoutClient.module.css';

interface CheckoutClientProps {
  products: any[];
  settings: any;
}

type Field = 'customer_name' | 'customer_phone' | 'customer_email' | 'delivery_address';

const CARD_ID = 'addon-card';

// TODO(owner): delivery windows. These are the existing options; the shop closes at 7:30 PM, so confirm
// whether the 4-8 PM window is real before keeping it.
const TIME_OPTIONS = [
  'Morning (9 AM – 12 PM)',
  'Afternoon (12 PM – 4 PM)',
  'Evening (4 PM – 8 PM)',
];

export default function CheckoutClient({ products }: CheckoutClientProps) {
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  // One Idempotency-Key per checkout attempt: reused on retries and double-taps, renewed when the cart changes.
  const idemRef = useRef<{ key: string; sig: string } | null>(null);
  const inFlight = useRef(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    fulfillment: 'delivery' as 'delivery' | 'pickup',
    delivery_address: '',
    delivery_date: '',
    delivery_time: '',
    card_message: '',
    notes: '',
    payment_method: 'whish' as 'whish' | 'cash',
  });

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.price_usd ?? 0) * i.quantity, 0),
    [items]
  );
  const hasPriceless = items.some((i) => i.price_usd == null);

  // Inline validation. Messages say what to do, not just what is wrong.
  const errors: Partial<Record<Field, string>> = {};
  if (!formData.customer_name.trim()) errors.customer_name = 'Please enter your name.';
  if (formData.customer_phone.replace(/\D/g, '').length < 7) {
    errors.customer_phone = 'Enter the phone number we can call or WhatsApp, e.g. +961 76 123 456.';
  }
  if (formData.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
    errors.customer_email = 'This email looks incomplete. Fix it, or leave it empty.';
  }
  if (formData.fulfillment === 'delivery' && !formData.delivery_address.trim()) {
    errors.delivery_address = 'Please tell us where to deliver (area and a landmark is enough).';
  }
  const showErr = (f: Field) => (touched[f] ? errors[f] : undefined);
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));
  const fieldProps = (f: Field) => ({
    'aria-invalid': showErr(f) ? true : undefined,
    'aria-describedby': showErr(f) ? `${f}-err` : undefined,
    onBlur: () => touch(f),
  });
  const ErrMsg = ({ f }: { f: Field }) =>
    showErr(f) ? <p id={`${f}-err`} className="form-error" role="alert" style={{ marginTop: '4px' }}>{errors[f]}</p> : null;

  const addProduct = (p: any) =>
    addItem({
      id: p.id,
      name: p.name,
      price_usd: p.price_usd ?? null,
      image_url: p.image_url ?? null,
      is_event_product: false,
      slug: p.slug ?? p.id,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (items.length === 0) {
      setSubmitError('Your order is empty. Choose a gift below, then place your order.');
      errorRef.current?.focus();
      return;
    }
    const firstBad = (Object.keys(errors) as Field[])[0];
    if (firstBad) {
      setTouched({ customer_name: true, customer_phone: true, customer_email: true, delivery_address: true });
      document.getElementById(firstBad)?.focus();
      return;
    }

    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);

    const sig = JSON.stringify(items.map((i) => [i.lineId, i.quantity]));
    if (!idemRef.current || idemRef.current.sig !== sig) {
      idemRef.current = { key: crypto.randomUUID(), sig };
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idemRef.current.key },
        body: JSON.stringify({
          ...formData,
          card_message: formData.card_message.trim() || undefined,
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            // The orders API only accepts absolute https image URLs; local /images paths are omitted.
            image_url: i.image_url?.startsWith('https://') ? i.image_url : null,
            is_event_product: i.is_event_product,
            event_id: i.event_id ?? null,
          })),
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string; orderNumber?: string };
      if (!response.ok) throw new Error(result.error);

      const snapshot = {
        orderNumber: result.orderNumber,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, priceUsd: i.price_usd })),
        subtotalUsd: subtotal,
        paymentMethod: formData.payment_method,
        customerName: formData.customer_name,
        customerPhone: formData.customer_phone,
        hasEmail: !!formData.customer_email.trim(),
        fulfillment: formData.fulfillment,
        deliveryDate: formData.delivery_date,
        deliveryTime: formData.delivery_time,
        cardMessage: formData.card_message.trim(),
      };
      sessionStorage.setItem('rebellys_order_snapshot', JSON.stringify(snapshot));

      idemRef.current = null;
      clearCart();
      router.push(`/checkout/success?order=${result.orderNumber}`);
    } catch (err: any) {
      setSubmitError(
        `${err?.message || 'We could not send your order.'} Your cart is saved. Please try again, or call or WhatsApp us on ${SHOP.phoneDisplay} and we will take the order.`
      );
      inFlight.current = false;
      setLoading(false);
      setTimeout(() => errorRef.current?.focus(), 0);
    }
  };

  const hasItems = items.length > 0;

  return (
    <main className="main-site checkout-page">
      <section className={styles.checkoutHero}>
        <div className={`container ${styles.checkoutHeroInner}`}>
          <div>
            <h1 className="section-title">Your <em>Order</em></h1>
            <p className="section-subtitle" style={{ maxWidth: '680px' }}>
              Send us your order and we will call or WhatsApp you to confirm the total, delivery or pickup, and timing. Nothing is charged on this website.
            </p>
          </div>
          <div className={styles.checkoutNote}>
            <strong>What happens next</strong>
            <span>1. You place the order here</span>
            <span>2. We call or WhatsApp to confirm</span>
            <span>3. You pay with Whish or cash</span>
            <span>4. We deliver, or you collect</span>
          </div>
        </div>
      </section>

      <section className={styles.checkoutSection}>
        <div className={`container ${styles.checkoutGrid}`}>
          {/* Products Grid (Left on desktop, after the form on phones when the cart has items) */}
          <div className={styles.checkoutItemsCol}>
            <h2 className={styles.checkoutHeading}>{hasItems ? 'Add another gift' : 'Choose your gift'}</h2>
            <div className={styles.checkoutProducts}>
              {products.map((product) => (
                <article key={product.id} className={styles.checkoutProduct}>
                  {product.image_url && <img src={product.image_url} alt={product.name} loading="lazy" />}
                  <div className={styles.checkoutProductBody}>
                    <span className="card-tag" style={{ display: 'inline-block', alignSelf: 'flex-start', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--rose-500)', background: 'rgba(233,30,140,.08)', padding: '3px 10px', borderRadius: 'var(--radius-xl)', marginBottom: '10px' }}>
                      {product.tag}
                    </span>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <small>{product.price_usd != null ? formatUsd(product.price_usd) : 'Price confirmed when we call you'}</small>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      aria-label={`Add ${product.name} to your order`}
                      onClick={() => addProduct(product)}
                    >
                      Add
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Order panel (Right on desktop, first on phones when the cart has items) */}
          <div className={`${styles.cartPanel} ${hasItems ? styles.cartPanelFirst : ''}`}>
            <div className={styles.cartPanelHeader}>
              <h2 className={styles.checkoutHeading} style={{ marginBottom: 0 }}>Your Order</h2>
              {hasItems && (
                <button className={styles.cartClear} type="button" onClick={() => { if (window.confirm('Remove everything from your order?')) clearCart(); }}>Clear all</button>
              )}
            </div>

            <div className={styles.cartItems}>
              {!hasItems ? (
                <div className={styles.cartEmpty}>
                  <p style={{ marginBottom: '10px' }}>Your order is empty. Choose a gift from the list, or start from our collections.</p>
                  <Link href="/collections" className="btn btn-primary btn-sm" style={{ minHeight: '44px' }}>Browse gifts</Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.lineId} className={styles.cartItem}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.price_usd == null
                          ? 'Price confirmed when we call you'
                          : item.price_usd === 0
                            ? 'Free'
                            : `${formatUsd(item.price_usd)}${item.quantity > 1 ? ` × ${item.quantity} = ${formatUsd(item.price_usd * item.quantity)}` : ''}`}
                      </span>
                    </div>
                    <div className="qty-ctrl" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button type="button" className="qty-btn" aria-label={`Decrease quantity of ${item.name}`} disabled={item.quantity <= 1} onClick={() => updateQuantity(item.lineId, item.quantity - 1)}>−</button>
                      <span className="qty-val" aria-live="polite">{item.quantity}</span>
                      <button type="button" className="qty-btn" aria-label={`Increase quantity of ${item.name}`} onClick={() => updateQuantity(item.lineId, item.quantity + 1)}>+</button>
                      <button type="button" className="qty-btn" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.lineId)}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {hasItems && (
              <div className={styles.addOnsWrap}>
                <AddOnPicker label="Add a card or balloon" />
              </div>
            )}

            {hasItems && (
              <dl className={styles.totals}>
                <div><dt>Items subtotal</dt><dd>{hasPriceless ? 'Confirmed when we call you' : formatUsd(subtotal)}</dd></div>
                <div><dt>Delivery</dt><dd>{formData.fulfillment === 'pickup' ? 'None (pickup)' : 'Confirmed when we call you'}</dd></div>
              </dl>
            )}

            <form onSubmit={handleSubmit} className={styles.checkoutForm} noValidate>
              <h3 className={styles.formHeading}>Your details</h3>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="customer_name">Full name <span className="required" aria-hidden="true">*</span></label>
                <input
                  id="customer_name"
                  name="name"
                  autoComplete="name"
                  enterKeyHint="next"
                  type="text"
                  className="form-input"
                  required
                  aria-required="true"
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  {...fieldProps('customer_name')}
                />
                <ErrMsg f="customer_name" />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="customer_phone">Phone number (WhatsApp) <span className="required" aria-hidden="true">*</span></label>
                <input
                  id="customer_phone"
                  name="tel"
                  inputMode="tel"
                  enterKeyHint="next"
                  type="tel"
                  className="form-input"
                  required
                  aria-required="true"
                  autoComplete="tel"
                  placeholder="+961 XX XXX XXX"
                  value={formData.customer_phone}
                  onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                  {...fieldProps('customer_phone')}
                />
                <p className={styles.help}>We will call or WhatsApp this number to confirm your order.</p>
                <ErrMsg f="customer_phone" />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="customer_email">Email (optional)</label>
                <input
                  id="customer_email"
                  name="email"
                  inputMode="email"
                  enterKeyHint="next"
                  type="email"
                  className="form-input"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.customer_email}
                  onChange={e => setFormData({ ...formData, customer_email: e.target.value })}
                  {...fieldProps('customer_email')}
                />
                <p className={styles.help}>Only if you want a copy of your order by email.</p>
                <ErrMsg f="customer_email" />
              </div>

              <fieldset className={styles.fieldset}>
                <legend className="form-label">Delivery or pickup <span className="required" aria-hidden="true">*</span></legend>
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
                    <label htmlFor="f-pickup">Store pickup</label>
                  </div>
                </div>
                {/* TODO(owner): delivery areas, fee(s) and same-day cut-off. Replace this sentence with the real policy. */}
                <p className={styles.help}>
                  {formData.fulfillment === 'delivery'
                    ? `We bring it to your address. ${DELIVERY_NOTE}`
                    : `Collect it at ${SHOP.address}. ${HOURS_LABEL}. No delivery fee. We tell you when it is ready.`}
                </p>
              </fieldset>

              {formData.fulfillment === 'delivery' && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="delivery_address">Delivery address <span className="required" aria-hidden="true">*</span></label>
                  <input
                    id="delivery_address"
                    name="address"
                    autoComplete="street-address"
                    enterKeyHint="next"
                    type="text"
                    className="form-input"
                    required
                    aria-required="true"
                    placeholder="Area, street, building, landmark"
                    value={formData.delivery_address}
                    onChange={e => setFormData({ ...formData, delivery_address: e.target.value })}
                    {...fieldProps('delivery_address')}
                  />
                  <ErrMsg f="delivery_address" />
                </div>
              )}

              {/* Scheduling */}
              <div className={styles.schedule}>
                <p className={styles.scheduleTitle}>
                  📅 {formData.fulfillment === 'delivery' ? 'When should it arrive?' : 'When will you collect it?'} (optional)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="delivery_date">Preferred date</label>
                    <input
                      id="delivery_date"
                      name="delivery_date"
                      autoComplete="off"
                      type="date"
                      className="form-input"
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      value={formData.delivery_date}
                      onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="delivery_time">Preferred time</label>
                    <select
                      id="delivery_time"
                      name="delivery_time"
                      className="form-input"
                      value={formData.delivery_time}
                      onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                    >
                      <option value="">Any time</option>
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <p className={styles.help} style={{ marginTop: '8px' }}>
                  Leave blank for the earliest possible. We confirm the exact time when we call you.
                </p>
              </div>

              <fieldset className={styles.fieldset}>
                <legend className="form-label">How will you pay? <span className="required" aria-hidden="true">*</span></legend>
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
                {/* TODO(owner): confirm payment wording (Whish number/timing, cash on delivery rules, any deposit). */}
                <p className={styles.help}>
                  {formData.payment_method === 'whish'
                    ? 'You pay with Whish after we confirm your total. Nothing is charged on this website.'
                    : `You pay cash when you ${formData.fulfillment === 'pickup' ? 'collect it' : 'receive it'}.`}
                </p>
              </fieldset>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="card_message">Message on the gift card (free)</label>
                <textarea
                  id="card_message"
                  name="card_message"
                  autoComplete="off"
                  enterKeyHint="next"
                  className="form-textarea"
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Happy birthday! With love from Maya"
                  value={formData.card_message}
                  onChange={e => setFormData({ ...formData, card_message: e.target.value })}
                  onBlur={() => {
                    // A written message needs a card: add the free one if it is not in the order yet.
                    if (formData.card_message.trim() && !items.some((i) => i.id === CARD_ID)) {
                      addItem({ id: CARD_ID, name: 'Card', price_usd: 0, image_url: null, is_event_product: false, slug: CARD_ID });
                    }
                  }}
                ></textarea>
                <p className={styles.help}>Leave empty for a blank card, or no card.</p>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="notes">Anything else we should know? (optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  autoComplete="off"
                  enterKeyHint="done"
                  className="form-textarea"
                  rows={2}
                  placeholder="Colours, who will receive it, door code..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              {submitError && (
                <div ref={errorRef} tabIndex={-1} role="alert" className={styles.submitError}>
                  {submitError}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1rem', minHeight: '48px' }} disabled={loading}>
                {loading ? <span className="spinner" role="status" aria-label="Sending your order"></span> : 'Place order'}
              </button>
              {!hasItems && (
                <p className={styles.help} style={{ textAlign: 'center', marginTop: '8px' }}>Choose at least one gift to place your order.</p>
              )}
              <div className={styles.reassure}>
                <p><strong>Nothing is charged now.</strong> We call or WhatsApp you to confirm the total, delivery fee and timing before you pay.</p>
                <p>
                  Questions? <a href={whatsappHref('Hello Rebelly\'s, I have a question about my order.')} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  {' · '}<a href={telHref}>{SHOP.phoneDisplay}</a>
                </p>
                <p>
                  Rebelly&apos;s, {SHOP.address}, since {SHOP.founded} ·{' '}
                  <a href={GOOGLE.url} target="_blank" rel="noopener noreferrer">{GOOGLE.rating}★ on Google ({GOOGLE.count})</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

    </main>
  );
}
