import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';

const blank = { paragraphs: [], expertise: [], hero: {}, about: {} };

export default function AdminContent() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => {
    const unsub = Store.subscribe(setState);
    return () => unsub();
  }, []);
  useRevealAll([]);

  const c = { ...blank, ...(state.content || {}) };
  const [draft, setDraft] = useState(c);
  useEffect(() => { setDraft({ ...blank, ...(state.content || {}) }); }, [state.content]);

  const [toast, setToast] = useState({ msg: '', show: false });
  const showToast = (m) => {
    setToast({ msg: m, show: true });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  function updateHero(key, value) {
    setDraft(d => ({ ...d, hero: { ...(d.hero || {}), [key]: value } }));
  }
  function updateRoles(value) {
    const roles = value.split(',').map(s => s.trim()).filter(Boolean);
    updateHero('roles', roles);
  }
  function updateAboutPara(idx, value) {
    setDraft(d => {
      const paragraphs = [...(d.about?.paragraphs || [])];
      paragraphs[idx] = value;
      return { ...d, about: { ...(d.about || {}), paragraphs } };
    });
  }
  function addAboutPara() {
    setDraft(d => ({ ...d, about: { ...(d.about || {}), paragraphs: [...(d.about?.paragraphs || []), ''] } }));
  }
  function removeAboutPara(idx) {
    setDraft(d => ({ ...d, about: { ...(d.about || {}), paragraphs: (d.about?.paragraphs || []).filter((_, i) => i !== idx) } }));
  }
  function updateAboutQuote(value) {
    setDraft(d => ({ ...d, about: { ...(d.about || {}), quote: value } }));
  }
  function updateExpertise(idx, key, value) {
    setDraft(d => {
      const expertise = [...(d.expertise || [])];
      expertise[idx] = { ...expertise[idx], [key]: value };
      return { ...d, expertise };
    });
  }
  function addExpertise() {
    setDraft(d => ({ ...d, expertise: [...(d.expertise || []), { title: '', desc: '' }] }));
  }
  function removeExpertise(idx) {
    setDraft(d => ({ ...d, expertise: (d.expertise || []).filter((_, i) => i !== idx) }));
  }

  function save() {
    Store.setContent(draft);
    showToast('Content saved');
  }
  function reset() {
    setDraft({ ...blank, ...(state.content || {}) });
    showToast('Reverted to last saved');
  }

  return (
    <AdminLayout title="Edit Content" subtitle="Hero, about, expertise & contact info">
      <div className="admin-form-card reveal">
        <div className="admin-form-head">
          <h3>Hero Section</h3>
          <p>Headline supports <code>&lt;em&gt;...&lt;/em&gt;</code> for the gold italic accent. Use new lines to break the headline.</p>
        </div>
        <div className="field">
          <label>Status pill text</label>
          <input value={draft.hero?.statusPill || ''} onChange={e => updateHero('statusPill', e.target.value)} />
        </div>
        <div className="field">
          <label>Headline (supports &lt;em&gt; tags + line breaks)</label>
          <textarea rows="3" value={draft.hero?.headline || ''} onChange={e => updateHero('headline', e.target.value)} />
        </div>
        <div className="field">
          <label>Tagline</label>
          <textarea rows="3" value={draft.hero?.tagline || ''} onChange={e => updateHero('tagline', e.target.value)} />
        </div>
        <div className="field">
          <label>Roles (comma-separated chips)</label>
          <input value={(draft.hero?.roles || []).join(', ')} onChange={e => updateRoles(e.target.value)} />
        </div>
      </div>

      <div className="admin-form-card reveal">
        <div className="admin-form-head">
          <h3>About Me</h3>
          <p>Add paragraphs that appear in the About section. Optional pull-quote is highlighted as an accent.</p>
        </div>
        {(draft.about?.paragraphs || []).map((p, i) => (
          <div className="field" key={i}>
            <label>Paragraph {i + 1} <button type="button" className="link-danger" onClick={() => removeAboutPara(i)}>remove</button></label>
            <textarea rows="3" value={p} onChange={e => updateAboutPara(i, e.target.value)} />
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={addAboutPara}>+ Add paragraph</button>
        <div className="field" style={{ marginTop: 18 }}>
          <label>Pull-quote (optional)</label>
          <textarea rows="2" value={draft.about?.quote || ''} onChange={e => updateAboutQuote(e.target.value)} />
        </div>
      </div>

      <div className="admin-form-card reveal">
        <div className="admin-form-head">
          <h3>Expertise Pillars</h3>
          <p>Three short pillars work best. Each shows an icon + title + description.</p>
        </div>
        {(draft.expertise || []).map((ex, i) => (
          <div key={i} className="field-row" style={{ alignItems: 'flex-start' }}>
            <div className="field" style={{ flex: '0 0 200px' }}>
              <label>Title #{i + 1}</label>
              <input value={ex.title || ''} onChange={e => updateExpertise(i, 'title', e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Description <button type="button" className="link-danger" onClick={() => removeExpertise(i)}>remove</button></label>
              <textarea rows="2" value={ex.desc || ''} onChange={e => updateExpertise(i, 'desc', e.target.value)} />
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={addExpertise}>+ Add pillar</button>
      </div>

      <div className="admin-form-card reveal">
        <div className="admin-form-head">
          <h3>Contact &amp; Address</h3>
          <p>Used in the hero photo tag, footer, schedule page and contact section.</p>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Business Email</label>
            <input value={draft.email1 || ''} onChange={e => setDraft(d => ({ ...d, email1: e.target.value }))} />
          </div>
          <div className="field">
            <label>Personal Email</label>
            <input value={draft.email2 || ''} onChange={e => setDraft(d => ({ ...d, email2: e.target.value }))} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Phone</label>
            <input value={draft.phone || ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
          </div>
          <div className="field">
            <label>Address (used as default location)</label>
            <input value={draft.address || ''} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="admin-actions-bar">
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <button className="btn btn-primary" onClick={save}>Save All Changes</button>
      </div>

      <Toast {...toast} />
    </AdminLayout>
  );
}
