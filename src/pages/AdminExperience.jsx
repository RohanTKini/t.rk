import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import { useConfirm } from '../components/useConfirm.jsx';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';
import { newId, formatMonthYear } from '../lib/helpers.js';

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Volunteer'];

function buildPeriod(startDate, endDate, current) {
  const s = startDate ? formatMonthYear(startDate) : '';
  if (!s) return '';
  if (current) return `${s} — Present`;
  if (!endDate) return s;
  return `${s} — ${formatMonthYear(endDate)}`;
}

function buildDuration(startDate, endDate, current) {
  if (!startDate) return '';
  const start = new Date(startDate + 'T00:00:00');
  const end = (current || !endDate) ? new Date() : new Date(endDate + 'T00:00:00');
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 1) return '';
  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  if (yrs && mos) return `${yrs} yr${yrs > 1 ? 's' : ''} ${mos} mo${mos > 1 ? 's' : ''}`;
  if (yrs)        return `${yrs} yr${yrs > 1 ? 's' : ''}`;
  return `${mos} mo${mos > 1 ? 's' : ''}`;
}

export default function AdminExperience() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => { const u = Store.subscribe(setState); return () => u(); }, []);
  useRevealAll([state.experiences?.length]);

  const list = state.experiences || [];

  const [form, setForm] = useState({
    role: '', org: '', type: 'Full-time', startDate: '', endDate: '', current: true, location: ''
  });
  const [editing, setEditing] = useState(null);
  const { confirm, confirmEl } = useConfirm();
  const [toast, setToast] = useState({ msg: '', show: false });
  const showToast = (m) => {
    setToast({ msg: m, show: true });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  function reset() {
    setForm({ role: '', org: '', type: 'Full-time', startDate: '', endDate: '', current: true, location: '' });
    setEditing(null);
  }

  function save(e) {
    e?.preventDefault?.();
    if (!form.role.trim() || !form.org.trim() || !form.startDate) {
      showToast('Role, organisation and start date are required'); return;
    }
    const period = buildPeriod(form.startDate, form.endDate, form.current);
    const duration = buildDuration(form.startDate, form.endDate, form.current);
    const entry = {
      id: editing || newId(),
      role: form.role.trim(),
      org: form.org.trim(),
      type: form.type,
      period,
      duration,
      location: form.location.trim(),
      startDate: form.startDate,
      endDate: form.current ? '' : form.endDate,
      current: form.current
    };
    const next = editing
      ? list.map(x => x.id === editing ? entry : x)
      : [entry, ...list];
    Store.setExperiences(next);
    showToast(editing ? 'Experience updated' : 'Experience added');
    reset();
  }

  function startEdit(item) {
    setEditing(item.id);
    setForm({
      role: item.role || '',
      org: item.org || '',
      type: item.type || 'Full-time',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      current: item.current ?? !item.endDate,
      location: item.location || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id) {
    const ok = await confirm({
      title: 'Remove this experience?',
      message: 'This role will be removed from your portfolio timeline. This cannot be undone.',
      confirmText: 'Remove'
    });
    if (!ok) return;
    Store.setExperiences(list.filter(x => x.id !== id));
    showToast('Removed');
    if (editing === id) reset();
  }

  return (
    <AdminLayout title="Experience" subtitle={`${list.length} role${list.length === 1 ? '' : 's'}`}>
      <form className="admin-form-card reveal" onSubmit={save}>
        <div className="admin-form-head">
          <h3>{editing ? 'Edit experience' : 'Add new experience'}</h3>
          <p>Periods render as <em>Sep 2021 — Present</em> or <em>Mar 2016 — Mar 2026</em>. Duration is auto-calculated.</p>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Designation / Role <span className="req">*</span></label>
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Founder Director" />
          </div>
          <div className="field">
            <label>Company / Organisation <span className="req">*</span></label>
            <input value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))} placeholder="e.g. Section Infin-8" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Location</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, State, Country" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Start date <span className="req">*</span></label>
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="field">
            <label>End date {form.current && <span className="muted">(disabled — currently here)</span>}</label>
            <input type="date" value={form.endDate} disabled={form.current} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
        </div>
        <label className="checkbox-line">
          <input type="checkbox" checked={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.checked }))} />
          I currently hold this role (period reads "— Present")
        </label>
        <div className="admin-actions-bar">
          {editing && <button type="button" className="btn btn-ghost" onClick={reset}>Cancel edit</button>}
          <button type="submit" className="btn btn-primary">{editing ? 'Update Experience' : '+ Add Experience'}</button>
        </div>
      </form>

      <div className="section-head"><div className="admin-section-title">All experiences</div></div>
      <div className="admin-list">
        {list.length === 0 && (
          <div className="empty-block">
            <h3>No experiences yet</h3>
            <p>Add your first role using the form above.</p>
          </div>
        )}
        {list.map((item, i) => (
          <div key={item.id} className={`admin-list-card reveal delay-${(i % 5) + 1}`}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row-title">{item.role}</div>
              <div className="row-sub">{item.org}</div>
              <div className="row-meta">
                {item.type && <span>{item.type}</span>}
                {item.period && <span>· {item.period}</span>}
                {item.duration && <span>· {item.duration}</span>}
                {item.location && <span>· {item.location}</span>}
              </div>
            </div>
            <div className="row-actions">
              <button className="topbar-btn" onClick={() => startEdit(item)}>Edit</button>
              <button className="topbar-btn danger" onClick={() => remove(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Toast {...toast} />
      {confirmEl}
    </AdminLayout>
  );
}
