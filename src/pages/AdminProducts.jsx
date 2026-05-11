import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import RkLogo from '../components/RkLogo.jsx';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';
import { newId, formatMonthYear } from '../lib/helpers.js';

export default function AdminProducts() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => { const u = Store.subscribe(setState); return () => u(); }, []);
  useRevealAll([state.products?.length]);

  const list = state.products || [];

  const [form, setForm] = useState({
    name: '', tagline: '', image: '', launchDate: '', link: '', status: '',
    description: '', longDescription: '',
    techStack: '', features: '', gallery: ''
  });
  const [editing, setEditing] = useState(null);

  const STATUS_OPTIONS = ['', 'Live', 'In Development', 'Coming Soon', 'Concept'];
  const [toast, setToast] = useState({ msg: '', show: false });
  const showToast = (m) => {
    setToast({ msg: m, show: true });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  function reset() {
    setForm({
      name: '', tagline: '', image: '', launchDate: '', link: '', status: '',
      description: '', longDescription: '',
      techStack: '', features: '', gallery: ''
    });
    setEditing(null);
  }

  function save(e) {
    e?.preventDefault?.();
    if (!form.name.trim()) { showToast('Product name is required'); return; }
    const splitLines = (s) => s.split('\n').map(x => x.trim()).filter(Boolean);
    const splitCommas = (s) => s.split(',').map(x => x.trim()).filter(Boolean);
    const entry = {
      id: editing || newId(),
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      image: form.image.trim(),
      launchDate: form.launchDate,
      link: form.link.trim(),
      status: form.status.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      techStack: splitCommas(form.techStack),
      features:  splitLines(form.features),
      gallery:   splitLines(form.gallery)
    };
    const next = editing ? list.map(x => x.id === editing ? entry : x) : [entry, ...list];
    Store.setProducts(next);
    showToast(editing ? 'Product updated' : 'Product added');
    reset();
  }

  function startEdit(item) {
    setEditing(item.id);
    setForm({
      name: item.name || '',
      tagline: item.tagline || '',
      image: item.image || '',
      launchDate: item.launchDate || '',
      link: item.link || '',
      status: item.status || '',
      description: item.description || '',
      longDescription: item.longDescription || '',
      techStack: Array.isArray(item.techStack) ? item.techStack.join(', ') : (item.techStack || ''),
      features:  Array.isArray(item.features)  ? item.features.join('\n')   : (item.features || ''),
      gallery:   Array.isArray(item.gallery)   ? item.gallery.join('\n')    : (item.gallery || '')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remove(id) {
    if (!confirm('Remove this product?')) return;
    Store.setProducts(list.filter(x => x.id !== id));
    showToast('Removed');
    if (editing === id) reset();
  }

  /* Local file upload — encodes to data URL so it persists in Firebase
   * without needing Storage. Capped to ~600 KB to keep RTDB writes sane. */
  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 600 * 1024) {
      showToast('Image is large — best under 600 KB. Using anyway.');
    }
    const reader = new FileReader();
    reader.onload = () => setForm(s => ({ ...s, image: reader.result }));
    reader.readAsDataURL(f);
  }

  return (
    <AdminLayout title="Products" subtitle={`${list.length} product${list.length === 1 ? '' : 's'}`}>
      <form className="admin-form-card reveal" onSubmit={save}>
        <div className="admin-form-head">
          <h3>{editing ? 'Edit product' : 'Add new product'}</h3>
          <p>Any field left blank still renders gracefully — empty product cards show "Product Under Construction" with the RK logo.</p>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Product name</label>
            <input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} placeholder="e.g. PrithviMitr" />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm(s => ({ ...s, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || '— Choose —'}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Tagline (1-line subtitle)</label>
          <input value={form.tagline} onChange={e => setForm(s => ({ ...s, tagline: e.target.value }))} placeholder="A short, punchy line about the product." />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Launch date</label>
            <input type="date" value={form.launchDate} onChange={e => setForm(s => ({ ...s, launchDate: e.target.value }))} />
          </div>
          <div className="field">
            <label>Project link</label>
            <input type="url" value={form.link} onChange={e => setForm(s => ({ ...s, link: e.target.value }))} placeholder="https://example.com" />
          </div>
        </div>
        <div className="field">
          <label>Short description (shown on product card)</label>
          <textarea rows="2" value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} placeholder="A short pitch — what it is, who it's for, why it matters." />
        </div>
        <div className="field">
          <label>Long description (detail page overview)</label>
          <textarea rows="4" value={form.longDescription} onChange={e => setForm(s => ({ ...s, longDescription: e.target.value }))} placeholder="The fuller story — context, audience, what makes it different." />
        </div>
        <div className="field">
          <label>Tech stack (comma-separated)</label>
          <input value={form.techStack} onChange={e => setForm(s => ({ ...s, techStack: e.target.value }))} placeholder="React, Node.js, Firebase, Tailwind" />
        </div>
        <div className="field">
          <label>Key features (one per line)</label>
          <textarea rows="4" value={form.features} onChange={e => setForm(s => ({ ...s, features: e.target.value }))} placeholder={"Verified founder profiles\nAsync deal-room\nCommunity feed"} />
        </div>
        <div className="field">
          <label>Additional gallery image URLs (one per line)</label>
          <textarea rows="3" value={form.gallery} onChange={e => setForm(s => ({ ...s, gallery: e.target.value }))} placeholder={"https://image-1.jpg\nhttps://image-2.jpg"} />
        </div>
        <div className="field-row" style={{ alignItems: 'flex-start' }}>
          <div className="field">
            <label>Image URL</label>
            <input type="url" value={form.image.startsWith('data:') ? '' : form.image}
              onChange={e => setForm(s => ({ ...s, image: e.target.value }))}
              placeholder="https://… or upload a file →" />
          </div>
          <div className="field" style={{ flex: '0 0 200px' }}>
            <label>Or upload</label>
            <input type="file" accept="image/*" onChange={onFile} />
          </div>
        </div>

        {form.image ? (
          <div className="image-preview"><img src={form.image} alt="preview" /></div>
        ) : (
          <div className="image-preview empty"><RkLogo size={48} /><span>Image preview will appear here</span></div>
        )}

        {form.launchDate && <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Will display: <strong>Launched {formatMonthYear(form.launchDate)}</strong></div>}

        <div className="admin-actions-bar">
          {editing && <button type="button" className="btn btn-ghost" onClick={reset}>Cancel edit</button>}
          <button type="submit" className="btn btn-primary">{editing ? 'Update Product' : '+ Add Product'}</button>
        </div>
      </form>

      <div className="section-head"><div className="admin-section-title">All products</div></div>
      <div className="admin-list">
        {list.length === 0 && (
          <div className="empty-block">
            <RkLogo size={56} />
            <h3>No products yet</h3>
            <p>The portfolio shows a "Product Under Construction" placeholder until you add one.</p>
          </div>
        )}
        {list.map((item, i) => (
          <div key={item.id} className={`admin-list-card reveal delay-${(i % 5) + 1}`}>
            <div className="row-thumb">
              {item.image ? <img src={item.image} alt={item.name} /> : <RkLogo size={42} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row-title">{item.name || <span className="muted">(untitled)</span>}</div>
              <div className="row-meta">
                {item.launchDate && <span>Launched {formatMonthYear(item.launchDate)}</span>}
                {item.link && <span>· <a href={item.link} target="_blank" rel="noopener noreferrer">visit</a></span>}
              </div>
              {item.description && <div className="row-sub" style={{ marginTop: 6 }}>{item.description}</div>}
            </div>
            <div className="row-actions">
              <button className="topbar-btn" onClick={() => startEdit(item)}>Edit</button>
              <button className="topbar-btn danger" onClick={() => remove(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Toast {...toast} />
    </AdminLayout>
  );
}
