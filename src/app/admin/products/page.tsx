'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types';

const EMPTY: Partial<Product> = { name:'', slug:'', tag:'', description:'', image_url:'', image_urls:[], price_usd: undefined, is_active:true, sort_order:0 };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Product>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/admin/products');
    const d = await r.json();
    setProducts(d.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (p: Product) => { setForm(p); setEditId(p.id); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    const method = editId ? 'PATCH' : 'POST';
    const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products';
    await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    await load();
    setShowForm(false);
    setSaving(false);
  };

  const toggleActive = async (p: Product) => {
    await fetch(`/api/admin/products/${p.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const remove = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method:'DELETE' });
    setProducts(prev => prev.map(x => x.id === id ? { ...x, is_active: false } : x));
  };

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Products</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <>
          <div className="overlay" onClick={() => setShowForm(false)} />
          <div className="modal-wrap">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">{editId ? 'Edit Product' : 'New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="drawer-close">✕</button>
              </div>
              <div className="modal-body">
                <div style={{display:'grid',gap:'1rem'}}>
                  {(['name','slug','tag','description'] as const).map(f => (
                    <div className="form-group" key={f}>
                      <label className="form-label" style={{textTransform:'capitalize'}}>{f.replace('_',' ')}</label>
                      {f === 'description'
                        ? <textarea className="form-textarea" value={(form[f] as string) ?? ''} onChange={e => setForm(p => ({...p, [f]: e.target.value}))} />
                        : <input className="form-input" value={(form[f] as string) ?? ''} onChange={e => setForm(p => ({...p, [f]: e.target.value}))} />
                      }
                    </div>
                  ))}

                  {/* Multi-image gallery URLs */}
                  <div className="form-group">
                    <label className="form-label">Product Images (gallery)</label>
                    <p style={{fontSize:'0.78rem',color:'var(--text-muted)',marginBottom:'8px'}}>
                      Add one URL per image. The first image is also used as the cover in the cart.
                    </p>
                    {(form.image_urls ?? []).map((url, i) => (
                      <div key={i} style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                        <input
                          className="form-input"
                          style={{flex:1}}
                          type="url"
                          placeholder="https://..."
                          value={url}
                          onChange={e => {
                            const next = [...(form.image_urls ?? [])];
                            next[i] = e.target.value;
                            setForm(p => ({...p, image_urls: next, image_url: next[0] ?? p.image_url}));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = (form.image_urls ?? []).filter((_,j) => j !== i);
                            setForm(p => ({...p, image_urls: next, image_url: next[0] ?? ''}));
                          }}
                          style={{background:'#fee2e2',color:'#991b1b',border:'none',borderRadius:'var(--radius-sm)',padding:'0 10px',cursor:'pointer',fontWeight:600}}
                        >✕</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setForm(p => ({...p, image_urls: [...(p.image_urls ?? []), '']}))}
                    >
                      + Add Image URL
                    </button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    <div className="form-group">
                      <label className="form-label">Price (USD)</label>
                      <input type="number" step="0.01" className="form-input" value={form.price_usd ?? ''} onChange={e => setForm(p => ({...p, price_usd: parseFloat(e.target.value) || undefined}))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sort Order</label>
                      <input type="number" className="form-input" value={form.sort_order ?? 0} onChange={e => setForm(p => ({...p, sort_order: parseInt(e.target.value)}))} />
                    </div>
                  </div>
                  <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'0.9rem'}}>
                    <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm(p => ({...p, is_active: e.target.checked}))} />
                    Active (visible on site)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? <span className="spinner" /> : (editId ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Table */}
      <div className="admin-card" style={{overflowX:'auto'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'3rem'}}><div className="spinner spinner-rose" style={{margin:'0 auto'}} /></div>
        ) : products.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>
            <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>🌹</div>
            <p>No products yet. Add your first product!</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Image</th><th>Name</th><th>Tag</th><th>Price</th><th>Sort</th><th>Active</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{width:48,height:48,objectFit:'cover',borderRadius:'var(--radius-sm)'}} />
                      : <div style={{width:48,height:48,background:'var(--rose-200)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem'}}>🌸</div>
                    }
                  </td>
                  <td style={{fontWeight:600}}>{p.name}<br/><span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{p.slug}</span></td>
                  <td>{p.tag && <span className="badge badge-rose">{p.tag}</span>}</td>
                  <td>{p.price_usd ? `$${p.price_usd.toFixed(2)}` : '—'}</td>
                  <td>{p.sort_order}</td>
                  <td>
                    <button
                      onClick={() => toggleActive(p)}
                      style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.3rem'}}
                      title={p.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {p.is_active ? '✅' : '⭕'}
                    </button>
                  </td>
                  <td style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-sm" onClick={() => remove(p.id)} style={{background:'#fee2e2',color:'#991b1b',border:'none'}}>Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
