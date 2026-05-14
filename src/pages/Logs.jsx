import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import { Store } from '../lib/store.js';
import {
  formatDate, formatDateShort, formatTime12,
  computeDuration
} from '../lib/helpers.js';
import { useRevealAll } from '../lib/useReveal.js';

/* Long-press hook — only fires onLongPress after `ms` of held touch/mouse.
 * A quick tap/click is intentionally ignored (no onTap callback). */
function useLongPress(onLongPress, ms = 450) {
  const timer = useRef(null);

  const start = (e) => {
    /* Don't start a long-press timer when the press began on an
     * interactive child (delete button, edit button, etc.) */
    if (e.target.closest && e.target.closest('button, a, input, select, textarea')) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onLongPress?.(e), ms);
  };
  const cancel = () => clearTimeout(timer.current);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };
}

function timeAgo(iso) {
  if (!iso) return '';
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} day${Math.floor(sec / 86400) === 1 ? '' : 's'} ago`;
}

const MODES = ['In-person', 'Conference / Online Meeting', 'Visit', 'Event / Activity'];

/* Detail modal — view + edit modes for one booking. Portalled to <body>. */
function LogDetail({ log, onClose, onDelete, onSave, onToast }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  /* Reset draft + view-mode when a new log is opened or the modal closes. */
  useEffect(() => {
    if (log) {
      setDraft({
        name: log.name || '',
        phone: log.phone || '',
        email: log.email || '',
        topic: log.topic || '',
        desc: log.desc || '',
        mode: log.mode || '',
        date: log.date || '',
        time: log.time || '',
        endTime: log.endTime || ''
      });
      setEditing(false);
    }
  }, [log?.id]);

  useEffect(() => {
    if (!log) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [log, onClose]);

  if (!log || !draft) return null;

  function setField(key, value) {
    setDraft(d => ({ ...d, [key]: value }));
  }

  function save() {
    if (!draft.name.trim()) { onToast('Name is required'); return; }
    if (!draft.phone.trim()) { onToast('Phone is required'); return; }
    /* If both times set, recompute duration; otherwise keep the original. */
    const duration = (draft.time && draft.endTime)
      ? computeDuration(draft.time, draft.endTime) || log.duration
      : log.duration;
    onSave(log.id, {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      topic: draft.topic.trim(),
      desc: draft.desc.trim(),
      mode: draft.mode,
      date: draft.date,
      time: draft.time,
      endTime: draft.endTime,
      duration
    });
    setEditing(false);
    onToast('Booking updated');
  }

  function cancel() {
    setDraft({
      name: log.name || '', phone: log.phone || '', email: log.email || '',
      topic: log.topic || '', desc: log.desc || '', mode: log.mode || '',
      date: log.date || '', time: log.time || '', endTime: log.endTime || ''
    });
    setEditing(false);
  }

  /* View-mode rows */
  const viewFields = [
    ['Name',        log.name],
    ['Phone',       log.phone],
    ['Email',       log.email],
    ['Topic',       log.topic],
    ['Description', log.desc],
    ['Mode',        log.mode],
    ['Date',        formatDate(log.date)],
    ['Start time',  formatTime12(log.time)],
    ['End time',    formatTime12(log.endTime)],
    ['Duration',    log.duration],
    ['Submitted',   log.submittedAt ? `${new Date(log.submittedAt).toLocaleString('en-IN')} (${timeAgo(log.submittedAt)})` : ''],
    ['Booking ID',  log.id]
  ];

  return createPortal(
    <div className="log-modal" onClick={onClose}>
      <div className="log-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="log-modal-x" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className="log-modal-head">
          <span className="log-modal-eyebrow">{editing ? 'Editing booking' : 'Booking detail'}</span>
          <h3>{log.name || 'Anonymous booking'}</h3>
          <p>{log.topic || 'Untitled topic'}</p>
        </div>

        {editing ? (
          <div className="log-modal-edit">
            <div className="log-edit-row">
              <label>Name *</label>
              <input value={draft.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div className="log-edit-row">
              <label>Phone *</label>
              <input value={draft.phone} onChange={e => setField('phone', e.target.value)} />
            </div>
            <div className="log-edit-row">
              <label>Email</label>
              <input type="email" value={draft.email} onChange={e => setField('email', e.target.value)} />
            </div>
            <div className="log-edit-row">
              <label>Topic</label>
              <input value={draft.topic} onChange={e => setField('topic', e.target.value)} />
            </div>
            <div className="log-edit-row">
              <label>Description</label>
              <textarea rows="3" value={draft.desc} onChange={e => setField('desc', e.target.value)} />
            </div>
            <div className="log-edit-row">
              <label>Mode</label>
              <select value={draft.mode} onChange={e => setField('mode', e.target.value)}>
                <option value="">— Select —</option>
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="log-edit-row">
              <label>Date</label>
              <input type="date" value={draft.date} onChange={e => setField('date', e.target.value)} />
            </div>
            <div className="log-edit-grid2">
              <div className="log-edit-row">
                <label>Start</label>
                <input type="time" value={draft.time} onChange={e => setField('time', e.target.value)} />
              </div>
              <div className="log-edit-row">
                <label>End</label>
                <input type="time" value={draft.endTime} onChange={e => setField('endTime', e.target.value)} />
              </div>
            </div>
            {draft.time && draft.endTime && (
              <div className="log-edit-hint">
                New duration: <strong>{computeDuration(draft.time, draft.endTime) || '—'}</strong>
              </div>
            )}
          </div>
        ) : (
          <dl className="log-modal-grid">
            {viewFields.map(([k, v]) => (
              <div key={k} className="log-modal-row">
                <dt>{k}</dt>
                <dd>{v ? String(v) : <span className="muted">—</span>}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="log-modal-actions">
          {editing ? (
            <>
              <button type="button" className="topbar-btn" onClick={cancel}>Cancel</button>
              <button type="button" className="topbar-btn primary" onClick={save}>Save changes</button>
            </>
          ) : (
            <>
              <button type="button" className="topbar-btn danger" onClick={() => { onDelete(log.id); onClose(); }}>Delete</button>
              <button type="button" className="topbar-btn" onClick={onClose}>Close</button>
              <button type="button" className="topbar-btn primary" onClick={() => setEditing(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Logs() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => { const unsub = Store.subscribe(setState); return () => unsub(); }, []);
  const allLogs = Array.isArray(state.logs) ? state.logs : [];
  useRevealAll([allLogs.length]);

  const [activeId, setActiveId] = useState(null);
  /* Re-derive `active` from state so the modal mirrors the latest fields
   * after an in-modal edit (no stale closure). */
  const active = activeId ? allLogs.find(l => l.id === activeId) : null;

  const [toast, setToast] = useState({ msg: '', show: false });
  const showToast = (m) => {
    setToast({ msg: m, show: true });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  function deleteOne(id) {
    if (!confirm('Delete this booking? This cannot be undone.')) return;
    Store.deleteLog(id); showToast('Booking deleted');
  }
  function clearAll() {
    if (!confirm('Clear ALL booking logs? This cannot be undone.')) return;
    Store.clearLogs(); showToast('All logs cleared');
  }
  function saveLog(id, partial) {
    Store.updateLog(id, partial);
  }

  const sorted = [...allLogs].sort((a, b) => {
    const da = new Date((a.date || '') + 'T' + (a.time || '00:00')).getTime();
    const db = new Date((b.date || '') + 'T' + (b.time || '00:00')).getTime();
    return da - db;
  });

  const summary = allLogs.length === 0
    ? 'No bookings yet'
    : `${allLogs.length} booking${allLogs.length === 1 ? '' : 's'} — long-press a row to view & edit`;

  return (
    <AdminLayout
      title="Booking Log"
      subtitle={summary}
      headerRight={
        <div className="topbar-actions">
          <button className="topbar-btn" onClick={async () => { await Store.refresh(); showToast('Refreshed'); }}>Refresh</button>
          <button className="topbar-btn danger" onClick={clearAll}>Clear All</button>
        </div>
      }>
      <div className="logs-card reveal">
        <div className="logs-header">
          <div className="logs-title">All Bookings</div>
          <span className="badge badge-indigo">{allLogs.length} entr{allLogs.length === 1 ? 'y' : 'ies'}</span>
        </div>
        <div className="logs-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span><strong>Long-press</strong> any row to open the full booking — view description, email, end time, submitted-at, and edit any field.</span>
        </div>
        <div className="logs-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sl.</th><th>Name</th><th>Phone</th><th>Topic</th><th>Mode</th>
                <th>Date</th><th>Start</th><th>Duration</th><th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((l, i) => (
                <LogRow
                  key={l.id}
                  log={l}
                  index={i}
                  onOpen={() => setActiveId(l.id)}
                  onDelete={() => deleteOne(l.id)}
                />
              ))}
            </tbody>
          </table>
          {allLogs.length === 0 && (
            <div className="empty-state">
              No bookings yet. Entries appear here after visitors submit the form.
            </div>
          )}
        </div>
      </div>

      <LogDetail
        log={active}
        onClose={() => setActiveId(null)}
        onDelete={deleteOne}
        onSave={saveLog}
        onToast={showToast}
      />
      <Toast {...toast} />
    </AdminLayout>
  );
}

function LogRow({ log, index, onOpen, onDelete }) {
  /* Long-press only — quick taps/clicks do nothing (per request). */
  const press = useLongPress(onOpen);

  return (
    <tr className="log-row" {...press}>
      <td style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{index + 1}</td>
      <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{log.name || '—'}</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>{log.phone || '—'}</td>
      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-2)' }} title={log.topic}>{log.topic || '—'}</td>
      <td style={{ whiteSpace: 'nowrap' }}>{log.mode ? <span className="chip" style={{ fontSize: 11 }}>{log.mode}</span> : <span style={{ color: 'var(--ink-3)' }}>—</span>}</td>
      <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{formatDateShort(log.date)}</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{formatTime12(log.time)}</td>
      <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{log.duration || '—'}</td>
      <td style={{ textAlign: 'right' }}>
        <button
          className="row-delete"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>
  );
}
