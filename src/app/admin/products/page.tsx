'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import styles from '../admin.module.css';
import Icon from '@/app/admin/_ui/Icon';

const EMPTY: Partial<Product> = { name:'', slug:'', tag:'', description:'', image_url:'', image_urls:[], price_usd: undefined, is_active:true, sort_order:0 };

const TEXT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'tag', label: 'Tag' },
  { key: 'description', label: 'Description' },
] as const;

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
    const d = (await r.json()) as { products?: Product[] };
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
      <header className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <h1 className={styles.pageTitle}>Products</h1>
          <p className={styles.pageMeta}>{products.length} in the catalogue</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}><Icon name="plus" size={18} />Add product</button>
        </div>
      </header>

      {showForm && (
        <>
          <div className={styles.overlay} onClick={() => setShowForm(false)} />
          <div className={styles.modalWrap}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
              <div className={styles.modalHeader}>
                <h2 id="product-modal-title" className={styles.modalTitle}>{editId ? 'Edit product' : 'New product'}</h2>
                <button type="button" onClick={() => setShowForm(false)} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}><Icon name="close" size={16} />Close</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  {TEXT_FIELDS.map(({ key, label }) => (
                    <div className={styles.field} key={key}>
                      <label className={styles.label} htmlFor={`product-${key}`}>{label}</label>
                      {key === 'description'
                        ? <textarea id={`product-${key}`} name={key} className={styles.textarea} value={(form[key] as string) ?? ''} onChange={e => setForm(p => ({...p, [key]: e.target.value}))} />
                        : <input id={`product-${key}`} name={key} className={styles.input} value={(form[key] as string) ?? ''} onChange={e => setForm(p => ({...p, [key]: e.target.value}))} />
                      }
                    </div>
                  ))}

                  <div className={styles.field}>
                    <span className={styles.label}>Product images</span>
                    <p className={styles.help}>
                      Add one URL per image. The first image is also used as the cover in the cart.
                    </p>
                    {(form.image_urls ?? []).map((url, i) => (
                      <div key={i} className={styles.urlRow}>
                        <input
                          className={styles.input}
                          type="url"
                          name={`image-url-${i}`}
                          aria-label={`Image URL ${i + 1}`}
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
                          className={`${styles.btn} ${styles.btnDanger}`}
                          onClick={() => {
                            const next = (form.image_urls ?? []).filter((_,j) => j !== i);
                            setForm(p => ({...p, image_urls: next, image_url: next[0] ?? ''}));
                          }}
                        >
                          <Icon name="trash" size={16} />
                          Remove
                        </button>
                      </div>
                    ))}
                    <div>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => setForm(p => ({...p, image_urls: [...(p.image_urls ?? []), '']}))}
                      >
                        <Icon name="plus" size={16} />
                        Add image URL
                      </button>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="product-price">Price (USD)</label>
                      <input id="product-price" name="price_usd" type="number" step="0.01" className={styles.input} value={form.price_usd ?? ''} onChange={e => setForm(p => ({...p, price_usd: parseFloat(e.target.value) || undefined}))} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="product-sort">Sort order</label>
                      <input id="product-sort" name="sort_order" type="number" className={styles.input} value={form.sort_order ?? 0} onChange={e => setForm(p => ({...p, sort_order: parseInt(e.target.value)}))} />
                    </div>
                  </div>
                  <label className={styles.checkRow}>
                    <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm(p => ({...p, is_active: e.target.checked}))} />
                    Active (visible on the shop)
                  </label>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} disabled={saving}>
                  {saving ? 'Saving...' : (editId ? 'Save changes' : 'Create product')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <section className={`${styles.card} ${styles.cardFlush}`}>
        {loading ? (
          <p className={styles.loading} role="status">Loading products</p>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No products yet</p>
            <p className={styles.emptyText}>Add your first product and it will appear on the shop.</p>
            <div className={styles.emptyAction}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>Add product</button>
            </div>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><span className={styles.srOnly}>Image</span></th>
                  <th>Name</th>
                  <th>Tag</th>
                  <th className={styles.right}>Price</th>
                  <th className={styles.right}>Sort</th>
                  <th>Status</th>
                  <th><span className={styles.srOnly}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.image_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.image_url} alt={p.name} width={48} height={48} className={styles.thumb} />
                        : <div className={styles.thumbEmpty} aria-hidden="true" />
                      }
                    </td>
                    <td className={styles.cellStrong}>
                      {p.name}
                      <span className={styles.cellSub}>{p.slug}</span>
                    </td>
                    <td>{p.tag && <span className={`${styles.badge} ${styles.badgePreparing}`}>{p.tag}</span>}</td>
                    <td className={styles.money}>{p.price_usd ? `$${p.price_usd.toFixed(2)}` : '-'}</td>
                    <td className={`${styles.num} ${styles.right}`}>{p.sort_order}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleActive(p)}
                        aria-pressed={!!p.is_active}
                        title={p.is_active ? 'Click to hide from the shop' : 'Click to show on the shop'}
                        className={`${styles.toggle} ${p.is_active ? styles.toggleOn : ''}`}
                      >
                        <Icon name={p.is_active ? 'eye' : 'eye-off'} size={16} />
                        {p.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <div className={styles.cellActions}>
                        <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={() => openEdit(p)}>Edit</button>
                        <button type="button" className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => remove(p.id)}><Icon name="trash" size={16} />Archive</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
