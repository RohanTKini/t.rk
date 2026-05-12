import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import RkLogo from '../components/RkLogo.jsx';
import SmartImage from '../components/SmartImage.jsx';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';
import { newId } from '../lib/helpers.js';

export default function AdminGallery() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => { const u = Store.subscribe(setState); return () => u(); }, []);
  useRevealAll([state.gallery?.length]);

  const list = state.gallery || [];

  const [form, setForm] = useState({ image: '', location: '', caption: '' });
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState({ msg: '', show: false });
  const showToast = (m) => {
    setToast({ msg: m, show: true });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  function reset() {
    setForm({ image: '', location: '', caption: '' });
    setEditing(null);
  }

  function save(e) {
    e?.preventDefault?.();
    if (!form.image.trim()) { showToast('Add an image URL or upload a file'); return; }
    const entry = {
      id: editing || newId(),
      image: form.image.trim(),
      location: form.location.trim(),
      caption: form.caption.trim()
    };
    const next = editing ? list.map(x => x.id === editing ? entry : x) : [entry, ...list];
    Store.setGallery(next);
    showToast(editing ? 'Image updated' : 'Image added');
    reset();
  }

  function startEdit(item) {
    setEditing(item.id);
    setForm({ image: item.image || '', location: item.location || '', caption: item.caption || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remove(id) {
    if (!confirm('Remove this image from the gallery?')) return;
    Store.setGallery(list.filter(x => x.id !== id));
    showToast('Removed');
    if (editing === id) reset();
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 600 * 1024) showToast('Image is large — best under 600 KB.');
    const reader = new FileReader();
    reader.onload = () => setForm(s => ({ ...s, image: reader.result }));
    reader.readAsDataURL(f);
  }

  return (
    <AdminLayout title="Gallery" subtitle={`${list.length} image${list.length === 1 ? '' : 's'}`}>
      <form className="admin-form-card reveal" onSubmit={save}>
        <div className="admin-form-head">
          <h3>{editing ? 'Edit image' : 'Add gallery image'}</h3>
          <p>Each image shows a location label overlay on hover. The full grid lives at <code>/gallery</code> and the home page features a slider.</p>
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
        <div className="field">
          <label>Location text (overlay)</label>
          <input value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))} placeholder="e.g. Mangaluru · TEDx 2026" />
        </div>
        <div className="field">
          <label>Caption (optional)</label>
          <input value={form.caption} onChange={e => setForm(s => ({ ...s, caption: e.target.value }))} placeholder="Short note about the moment" />
        </div>

        {form.image ? (
          <div className="image-preview"><SmartImage src={form.image} alt="preview" fallbackSize={48} /></div>
        ) : (
          <div className="image-preview empty"><RkLogo size={48} /><span>Image preview will appear here</span></div>
        )}

        <div className="admin-actions-bar">
          {editing && <button type="button" className="btn btn-ghost" onClick={reset}>Cancel edit</button>}
          <button type="submit" className="btn btn-primary">{editing ? 'Update Image' : '+ Add to Gallery'}</button>
        </div>
      </form>

      <div className="section-head"><div className="admin-section-title">Gallery items</div></div>
      <div className="gallery-admin-grid">
        {list.length === 0 && (
          <div className="empty-block" style={{ gridColumn: '1 / -1' }}>
            <RkLogo size={56} />
            <h3>Nothing yet</h3>
            <p>Add your first achievement, work or moment using the form above.</p>
          </div>
        )}
        {list.map((item, i) => (
          <div key={item.id} className={`gallery-admin-tile reveal delay-${(i % 6) + 1}`}>
            <SmartImage src={item.image} alt={item.caption || item.location || 'Gallery item'} fallbackSize={36} />
            <div className="gallery-admin-meta">
              {item.location && <div className="row-title" style={{ fontSize: 13 }}>{item.location}</div>}
              {item.caption && <div className="row-sub">{item.caption}</div>}
            </div>
            <div className="gallery-admin-actions">
              <button type="button" className="mini-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(item); }}
                aria-label="Edit" title="Edit">✎</button>
              <button type="button" className="mini-btn danger"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(item.id); }}
                aria-label="Delete" title="Delete">×</button>
            </div>
          </div>
        ))}
      </div>

      <Toast {...toast} />
    </AdminLayout>
  );
}
