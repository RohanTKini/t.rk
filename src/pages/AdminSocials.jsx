import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';
import SocialIcon from '../components/SocialIcons.jsx';
import { newId } from '../lib/helpers.js';

const TYPES = ['instagram', 'linkedin', 'x', 'twitter', 'facebook', 'whatsapp', 'youtube', 'github', 'other'];

export default function AdminSocials() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => { const u = Store.subscribe(setState); return () => u(); }, []);
  useRevealAll([state.socials?.length]);

  const list = state.socials || [];

  const [form, setForm] = useState({ id: 'instagram', name: 'Instagram', href: '' });
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState({ msg: '', show: false });
  const showToast = (m) => {
    setToast({ msg: m, show: true });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  function reset() {
    setForm({ id: 'instagram', name: 'Instagram', href: '' });
    setEditing(null);
  }

  function save(e) {
    e?.preventDefault?.();
    if (!form.name.trim() || !form.href.trim()) { showToast('Name and URL are required'); return; }
    const entry = {
      id: editing || (form.id === 'other' ? newId() : form.id),
      name: form.name.trim(),
      href: form.href.trim()
    };
    const next = editing
      ? list.map(x => x.id === editing ? entry : x)
      : [...list.filter(x => x.id !== entry.id), entry];
    Store.setSocials(next);
    showToast(editing ? 'Social link updated' : 'Social link added');
    reset();
  }

  function startEdit(item) {
    setEditing(item.id);
    setForm({ id: item.id, name: item.name, href: item.href });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remove(id) {
    if (!confirm('Remove this social link?')) return;
    Store.setSocials(list.filter(x => x.id !== id));
    showToast('Removed');
    if (editing === id) reset();
  }

  function pickType(value) {
    const labelMap = { instagram: 'Instagram', linkedin: 'LinkedIn', x: 'X', twitter: 'Twitter', facebook: 'Facebook', whatsapp: 'WhatsApp', youtube: 'YouTube', github: 'GitHub', other: '' };
    setForm(s => ({ ...s, id: value, name: labelMap[value] ?? s.name }));
  }

  return (
    <AdminLayout title="Social Links" subtitle={`${list.length} link${list.length === 1 ? '' : 's'}`}>
      <form className="admin-form-card reveal" onSubmit={save}>
        <div className="admin-form-head">
          <h3>{editing ? 'Edit link' : 'Add social link'}</h3>
          <p>These show as round icon buttons in the contact section. Pick a known network for the matching icon, or "Other" for a generic globe.</p>
        </div>
        <div className="field-row">
          <div className="field" style={{ flex: '0 0 200px' }}>
            <label>Type / icon</label>
            <select value={form.id} onChange={e => pickType(e.target.value)} disabled={!!editing}>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Display name</label>
            <input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} placeholder="Instagram, LinkedIn, etc." />
          </div>
        </div>
        <div className="field">
          <label>URL</label>
          <input type="url" value={form.href} onChange={e => setForm(s => ({ ...s, href: e.target.value }))} placeholder="https://instagram.com/your-handle" />
        </div>
        <div className="admin-actions-bar">
          {editing && <button type="button" className="btn btn-ghost" onClick={reset}>Cancel edit</button>}
          <button type="submit" className="btn btn-primary">{editing ? 'Update Link' : '+ Add Link'}</button>
        </div>
      </form>

      <div className="section-head"><div className="admin-section-title">All social links</div></div>
      <div className="admin-list">
        {list.length === 0 && (
          <div className="empty-block">
            <h3>No social links yet</h3>
            <p>Add your first one above.</p>
          </div>
        )}
        {list.map((item, i) => (
          <div key={item.id} className={`admin-list-card reveal delay-${(i % 5) + 1}`}>
            <div className="row-thumb dark"><SocialIcon id={item.id} name={item.name} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row-title">{item.name}</div>
              <div className="row-sub" style={{ wordBreak: 'break-all' }}>{item.href}</div>
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
