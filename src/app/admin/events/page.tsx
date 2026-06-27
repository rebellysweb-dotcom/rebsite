'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Event, EventProduct } from '@/types';

const EMPTY_EVENT = { name:'', slug:'', description:'', banner_color:'#e91e8c', button_label:'', banner_image_url:'', is_active:false, auto_activate_from:'', auto_deactivate_at:'' };
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
      <div className="admin-topbar">
        <h1 className="admin-page-title">Events</h1>
        <button className="btn btn-primary" onClick={openCreateEvent}>+ Create Event</button>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <>
          <div className="overlay" onClick={() => setShowEventForm(false)} />
          <div className="modal-wrap">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">{editEventId ? 'Edit Event' : 'New Event'}</h2>
                <button onClick={() => setShowEventForm(false)} className="drawer-close">✕</button>
              </div>
              <div className="modal-body">
                <div style={{display:'grid',gap:'1rem'}}>
                  <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={eventForm.name} onChange={e => ef('name',e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Slug</label><input className="form-input" value={eventForm.slug} onChange={e => ef('slug',e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={eventForm.description} onChange={e => ef('description',e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Button Label</label><input className="form-input" value={eventForm.button_label} onChange={e => ef('button_label',e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Banner Image URL</label><input className="form-input" value={eventForm.banner_image_url} onChange={e => ef('banner_image_url',e.target.value)} /></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    <div className="form-group"><label className="form-label">Banner Color</label><input type="color" value={eventForm.banner_color} onChange={e => ef('banner_color',e.target.value)} style={{height:42,width:'100%',border:'1.5px solid rgba(45,10,30,.15)',borderRadius:'var(--radius)',cursor:'pointer'}} /></div>
                    <div className="form-group" style={{justifyContent:'flex-end'}}>
                      <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'0.9rem',marginTop:'auto'}}>
                        <input type="checkbox" checked={eventForm.is_active} onChange={e => ef('is_active',e.target.checked)} />
                        Active now
                      </label>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    <div className="form-group"><label className="form-label">Auto-Activate From</label><input type="datetime-local" className="form-input" value={eventForm.auto_activate_from} onChange={e => ef('auto_activate_from',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Auto-Deactivate At</label><input type="datetime-local" className="form-input" value={eventForm.auto_deactivate_at} onChange={e => ef('auto_deactivate_at',e.target.value)} /></div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowEventForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEvent} disabled={savingEvent}>
                  {savingEvent ? <span className="spinner" /> : (editEventId ? 'Save Changes' : 'Create Event')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Event Product Form Modal */}
      {showProductForm && selectedEvent && (
        <>
          <div className="overlay" onClick={() => setShowProductForm(false)} />
          <div className="modal-wrap">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">{editProductId ? 'Edit Event Product' : 'Add Event Product'}</h2>
                <button onClick={() => setShowProductForm(false)} className="drawer-close">✕</button>
              </div>
              <div className="modal-body">
                <div style={{display:'grid',gap:'1rem'}}>
                  <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={productForm.name} onChange={e => pf('name',e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={productForm.description} onChange={e => pf('description',e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Image URL</label><input className="form-input" value={productForm.image_url} onChange={e => pf('image_url',e.target.value)} /></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    <div className="form-group"><label className="form-label">Price (USD)</label><input type="number" step="0.01" className="form-input" value={productForm.price_usd} onChange={e => pf('price_usd', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Tag</label><input className="form-input" value={productForm.tag} onChange={e => pf('tag',e.target.value)} /></div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    <div className="form-group"><label className="form-label">Sort Order</label><input type="number" className="form-input" value={productForm.sort_order} onChange={e => pf('sort_order', parseInt(e.target.value) || 0)} /></div>
                    <div className="form-group" style={{justifyContent:'flex-end'}}>
                      <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'0.9rem',marginTop:'auto'}}>
                        <input type="checkbox" checked={productForm.is_active} onChange={e => pf('is_active',e.target.checked)} />
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowProductForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveProduct} disabled={savingProduct}>
                  {savingProduct ? <span className="spinner" /> : (editProductId ? 'Save' : 'Add Product')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Events + Products Panel Side-by-Side */}
      <div style={{display:'grid', gridTemplateColumns: selectedEvent ? '1fr 1fr' : '1fr', gap:'1.5rem'}}>
        {/* Events Table */}
        <div className="admin-card" style={{overflowX:'auto'}}>
          {loading ? (
            <div style={{textAlign:'center',padding:'3rem'}}><div className="spinner spinner-rose" style={{margin:'0 auto'}} /></div>
          ) : events.length === 0 ? (
            <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>🎉</div>
              <p>No events yet. Create your first event!</p>
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Color</th><th>Name</th><th>Active</th><th>Auto-Dates</th><th>Actions</th></tr></thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} style={{ background: selectedEvent?.id === ev.id ? 'rgba(233,30,140,.05)' : undefined }}>
                    <td><div style={{width:28,height:28,borderRadius:'50%',background:ev.banner_color,flexShrink:0}} /></td>
                    <td style={{fontWeight:600}}>
                      {ev.name}
                      <br/><span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>/{ev.slug}</span>
                    </td>
                    <td>
                      <button onClick={() => toggleEventActive(ev)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.3rem'}} title={ev.is_active ? 'Deactivate' : 'Activate'}>
                        {ev.is_active ? '✅' : '⭕'}
                      </button>
                    </td>
                    <td style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
                      {ev.auto_activate_from ? new Date(ev.auto_activate_from).toLocaleDateString() : '—'}
                      {' → '}
                      {ev.auto_deactivate_at ? new Date(ev.auto_deactivate_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditEvent(ev)}>Edit</button>
                        <button
                          className="btn btn-sm"
                          onClick={() => openManageProducts(ev)}
                          style={{background:'rgba(233,30,140,.08)',color:'var(--rose-700)',border:'none'}}
                        >
                          🌸 Products
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Event Products Panel */}
        {selectedEvent && (
          <div className="admin-card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
              <div>
                <h2 style={{fontFamily:'var(--ff-display)',fontSize:'1.1rem',fontWeight:700,margin:0}}>
                  🌸 {selectedEvent.name} Products
                </h2>
                <p style={{fontSize:'0.78rem',color:'var(--text-muted)',margin:'4px 0 0'}}>
                  Special products only available during this event
                </p>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button className="btn btn-primary btn-sm" onClick={openCreateProduct}>+ Add</button>
                <button className="btn btn-outline btn-sm" onClick={closeProductPanel}>✕</button>
              </div>
            </div>

            {loadingProducts ? (
              <div style={{textAlign:'center',padding:'2rem'}}><div className="spinner spinner-rose" style={{margin:'0 auto'}} /></div>
            ) : eventProducts.length === 0 ? (
              <div style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)',background:'rgba(45,10,30,.03)',borderRadius:'var(--radius)'}}>
                <p>No products for this event yet.</p>
                <button className="btn btn-primary btn-sm" onClick={openCreateProduct} style={{marginTop:'0.75rem'}}>Add First Product</button>
              </div>
            ) : (
              <div style={{display:'grid',gap:'0.75rem'}}>
                {eventProducts.map(p => (
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',background:'rgba(45,10,30,.03)',borderRadius:'var(--radius)',border: !p.is_active ? '1px dashed rgba(45,10,30,.15)' : 'none'}}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{width:44,height:44,objectFit:'cover',borderRadius:'var(--radius-sm)',flexShrink:0}} />
                      : <div style={{width:44,height:44,background:'var(--rose-200)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0}}>🌸</div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:'0.88rem'}}>{p.name}</div>
                      <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>
                        {p.price_usd ? `$${p.price_usd}` : 'No price'} · Sort: {p.sort_order}
                        {!p.is_active && ' · Inactive'}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEditProduct(p)} style={{padding:'4px 10px',minHeight:28}}>Edit</button>
                      <button className="btn btn-sm" onClick={() => deleteProduct(p.id)} style={{padding:'4px 10px',minHeight:28,background:'#fee2e2',color:'#991b1b',border:'none'}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
