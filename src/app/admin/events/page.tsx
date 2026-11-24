'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Event, EventProduct } from '@/types';
import styles from '../admin.module.css';
import Icon from '@/components/icons/Icon';

// banner_color feeds <input type="color">, which only accepts a hex value.
const EMPTY_EVENT = { name:'', slug:'', description:'', banner_color:'#844057', button_label:'', banner_image_url:'', is_active:false, auto_activate_from:'', auto_deactivate_at:'' };
const EMPTY_PRODUCT = { name:'', description:'', image_url:'', price_usd: '' as string | number, tag:'', sort_order: 0, is_active: true };

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  // Event products state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventProducts, setEventProducts] = useState<EventProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Load events
  const loadEvents = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/admin/events');
    const d = await r.json();
    setEvents(d.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Load event products
  const loadProducts = async (eventId: string) => {
    setLoadingProducts(true);
    const r = await fetch(`/api/admin/events/${eventId}/products`);
    const d = await r.json();
    setEventProducts(d.products ?? []);
    setLoadingProducts(false);
  };

  // Event CRUD
  const openCreateEvent = () => { setEventForm(EMPTY_EVENT); setEditEventId(null); setShowEventForm(true); };
  const openEditEvent = (e: Event) => {
    setEventForm({
      name: e.name, slug: e.slug, description: e.description ?? '',
      banner_color: e.banner_color, button_label: e.button_label ?? '',
      banner_image_url: e.banner_image_url ?? '', is_active: e.is_active,
      auto_activate_from: e.auto_activate_from ?? '', auto_deactivate_at: e.auto_deactivate_at ?? '',
    });
    setEditEventId(e.id);
    setShowEventForm(true);
  };

  const saveEvent = async () => {
    setSavingEvent(true);
    const method = editEventId ? 'PATCH' : 'POST';
    const url = editEventId ? `/api/admin/events/${editEventId}` : '/api/admin/events';
    await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(eventForm) });
    await loadEvents();
    setShowEventForm(false);
    setSavingEvent(false);
  };

  const toggleEventActive = async (e: Event) => {
    await fetch(`/api/admin/events/${e.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ is_active: !e.is_active }),
    });
    setEvents(prev => prev.map(x => x.id === e.id ? { ...x, is_active: !x.is_active } : x));
  };

  // Manage Products for an event
  const openManageProducts = (e: Event) => {
    setSelectedEvent(e);
    loadProducts(e.id);
  };

  const closeProductPanel = () => {
    setSelectedEvent(null);
    setEventProducts([]);
    setShowProductForm(false);
  };

  // Product CRUD
  const openCreateProduct = () => { setProductForm(EMPTY_PRODUCT); setEditProductId(null); setShowProductForm(true); };
  const openEditProduct = (p: EventProduct) => {
    setProductForm({
      name: p.name, description: p.description ?? '', image_url: p.image_url ?? '',
      price_usd: p.price_usd ?? '', tag: p.tag ?? '', sort_order: p.sort_order, is_active: p.is_active,
    });
    setEditProductId(p.id);
    setShowProductForm(true);
  };

  const saveProduct = async () => {
    if (!selectedEvent) return;
    setSavingProduct(true);
    const payload = {
      ...productForm,
      price_usd: productForm.price_usd === '' ? null : parseFloat(String(productForm.price_usd)) || null,
    };
    const method = editProductId ? 'PATCH' : 'POST';
    const url = editProductId
      ? `/api/admin/events/${selectedEvent.id}/products/${editProductId}`
      : `/api/admin/events/${selectedEvent.id}/products`;
    await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    await loadProducts(selectedEvent.id);
    setShowProductForm(false);
    setSavingProduct(false);
  };

  const deleteProduct = async (productId: string) => {
    if (!selectedEvent || !confirm('Delete this event product?')) return;
    await fetch(`/api/admin/events/${selectedEvent.id}/products/${productId}`, { method:'DELETE' });
    setEventProducts(prev => prev.filter(p => p.id !== productId));
  };

  const ef = (key: string, val: string | boolean | number) => setEventForm(p => ({ ...p, [key]: val }));
  const pf = (key: string, val: string | boolean | number) => setProductForm(p => ({ ...p, [key]: val }));

  return (
    <>
      <header className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <h1 className={styles.pageTitle}>Events</h1>
          <p className={styles.pageMeta}>Seasonal campaigns and the products that go with them</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateEvent}><Icon name="plus" size={18} />Create event</button>
        </div>
      </header>

      {showEventForm && (
        <>
          <div className={styles.overlay} onClick={() => setShowEventForm(false)} />
          <div className={styles.modalWrap}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
              <div className={styles.modalHeader}>
                <h2 id="event-modal-title" className={styles.modalTitle}>{editEventId ? 'Edit event' : 'New event'}</h2>
                <button type="button" onClick={() => setShowEventForm(false)} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}><Icon name="close" size={16} />Close</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="event-name">Name</label>
                    <input id="event-name" name="name" className={styles.input} value={eventForm.name} onChange={e => ef('name', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="event-slug">Slug</label>
                    <input id="event-slug" name="slug" className={styles.input} value={eventForm.slug} onChange={e => ef('slug', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="event-description">Description</label>
                    <textarea id="event-description" name="description" className={styles.textarea} value={eventForm.description} onChange={e => ef('description', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="event-button">Button label</label>
                    <input id="event-button" name="button_label" className={styles.input} value={eventForm.button_label} onChange={e => ef('button_label', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="event-banner-image">Banner image URL</label>
                    <input id="event-banner-image" name="banner_image_url" className={styles.input} value={eventForm.banner_image_url} onChange={e => ef('banner_image_url', e.target.value)} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="event-color">Banner colour</label>
                      <input id="event-color" name="banner_color" type="color" className={`${styles.input} ${styles.inputColor}`} value={eventForm.banner_color} onChange={e => ef('banner_color', e.target.value)} />
                    </div>
                    <div className={`${styles.field} ${styles.fieldEnd}`}>
                      <label className={styles.checkRow}>
                        <input type="checkbox" checked={eventForm.is_active} onChange={e => ef('is_active', e.target.checked)} />
                        Active now
                      </label>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="event-from">Activate automatically from</label>
                      <input id="event-from" name="auto_activate_from" type="datetime-local" className={styles.input} value={eventForm.auto_activate_from} onChange={e => ef('auto_activate_from', e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="event-until">Deactivate automatically at</label>
                      <input id="event-until" name="auto_deactivate_at" type="datetime-local" className={styles.input} value={eventForm.auto_deactivate_at} onChange={e => ef('auto_deactivate_at', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowEventForm(false)}>Cancel</button>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveEvent} disabled={savingEvent}>
                  {savingEvent ? 'Saving...' : (editEventId ? 'Save changes' : 'Create event')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showProductForm && selectedEvent && (
        <>
          <div className={styles.overlay} onClick={() => setShowProductForm(false)} />
          <div className={styles.modalWrap}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="event-product-modal-title">
              <div className={styles.modalHeader}>
                <h2 id="event-product-modal-title" className={styles.modalTitle}>{editProductId ? 'Edit event product' : 'Add event product'}</h2>
                <button type="button" onClick={() => setShowProductForm(false)} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}><Icon name="close" size={16} />Close</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="ep-name">Name</label>
                    <input id="ep-name" name="name" className={styles.input} value={productForm.name} onChange={e => pf('name', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="ep-description">Description</label>
                    <textarea id="ep-description" name="description" className={styles.textarea} value={productForm.description} onChange={e => pf('description', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="ep-image">Image URL</label>
                    <input id="ep-image" name="image_url" className={styles.input} value={productForm.image_url} onChange={e => pf('image_url', e.target.value)} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="ep-price">Price (USD)</label>
                      <input id="ep-price" name="price_usd" type="number" step="0.01" className={styles.input} value={productForm.price_usd} onChange={e => pf('price_usd', e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="ep-tag">Tag</label>
                      <input id="ep-tag" name="tag" className={styles.input} value={productForm.tag} onChange={e => pf('tag', e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="ep-sort">Sort order</label>
                      <input id="ep-sort" name="sort_order" type="number" className={styles.input} value={productForm.sort_order} onChange={e => pf('sort_order', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className={`${styles.field} ${styles.fieldEnd}`}>
                      <label className={styles.checkRow}>
                        <input type="checkbox" checked={productForm.is_active} onChange={e => pf('is_active', e.target.checked)} />
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowProductForm(false)}>Cancel</button>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveProduct} disabled={savingProduct}>
                  {savingProduct ? 'Saving...' : (editProductId ? 'Save' : 'Add product')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className={`${styles.twoColSplit} ${selectedEvent ? styles.twoColSplitOpen : ''}`}>
        <section className={`${styles.card} ${styles.cardFlush}`}>
          {loading ? (
            <p className={styles.loading} role="status">Loading events</p>
          ) : events.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No events yet</p>
              <p className={styles.emptyText}>Create an event for a season or occasion, then add its special products.</p>
              <div className={styles.emptyAction}>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateEvent}>Create event</button>
              </div>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th><span className={styles.srOnly}>Colour</span></th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Runs</th>
                    <th><span className={styles.srOnly}>Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => (
                    <tr key={ev.id} className={selectedEvent?.id === ev.id ? styles.rowSelected : undefined}>
                      <td><span className={styles.swatch} style={{ background: ev.banner_color }} aria-hidden="true" /></td>
                      <td className={styles.cellStrong}>
                        {ev.name}
                        <span className={styles.cellSub}>/{ev.slug}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleEventActive(ev)}
                          aria-pressed={!!ev.is_active}
                          title={ev.is_active ? 'Click to deactivate' : 'Click to activate'}
                          className={`${styles.toggle} ${ev.is_active ? styles.toggleOn : ''}`}
                        >
                          <Icon name={ev.is_active ? 'eye' : 'eye-off'} size={16} />
                          {ev.is_active ? 'Active' : 'Off'}
                        </button>
                      </td>
                      <td className={`${styles.num} ${styles.muted} ${styles.small}`}>
                        {ev.auto_activate_from ? new Date(ev.auto_activate_from).toLocaleDateString() : 'Not set'}
                        {' to '}
                        {ev.auto_deactivate_at ? new Date(ev.auto_deactivate_at).toLocaleDateString() : 'Not set'}
                      </td>
                      <td>
                        <div className={styles.cellActions}>
                          <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={() => openEditEvent(ev)}>Edit</button>
                          <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={() => openManageProducts(ev)}>Products</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedEvent && (
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>{selectedEvent.name} products</h2>
                <p className={styles.cardNote}>Only available while this event is running</p>
              </div>
              <div className={styles.headerActions}>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={openCreateProduct}><Icon name="plus" size={16} />Add</button>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={closeProductPanel}>Close</button>
              </div>
            </div>

            {loadingProducts ? (
              <p className={styles.loading} role="status">Loading products</p>
            ) : eventProducts.length === 0 ? (
              <div className={`${styles.empty} ${styles.emptyInset}`}>
                <p className={styles.emptyTitle}>No products for this event</p>
                <p className={styles.emptyText}>Add the first one to offer it during the event.</p>
                <div className={styles.emptyAction}>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={openCreateProduct}>Add first product</button>
                </div>
              </div>
            ) : (
              <div className={styles.itemList}>
                {eventProducts.map(p => (
                  <div key={p.id} className={`${styles.item} ${!p.is_active ? styles.itemInactive : ''}`}>
                    {p.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.image_url} alt={p.name} width={44} height={44} className={`${styles.thumb} ${styles.thumbSm}`} />
                      : <div className={`${styles.thumbEmpty} ${styles.thumbSm}`} aria-hidden="true" />
                    }
                    <div className={styles.itemBody}>
                      <div className={styles.itemName}>{p.name}</div>
                      <div className={`${styles.itemMeta} ${styles.num}`}>
                        {p.price_usd ? `$${p.price_usd}` : 'No price'} · Sort {p.sort_order}
                        {!p.is_active && ' · Inactive'}
                      </div>
                    </div>
                    <div className={styles.cellActions}>
                      <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={() => openEditProduct(p)}>Edit</button>
                      <button type="button" className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => deleteProduct(p.id)}><Icon name="trash" size={16} />Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
