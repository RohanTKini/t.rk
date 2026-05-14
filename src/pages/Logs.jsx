import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import { Store } from '../lib/store.js';
import { formatDate, formatDateShort, formatTime12 } from '../lib/helpers.js';
import { useRevealAll } from '../lib/useReveal.js';

/* Long-press hook — fires onLongPress after `ms` of held touch/mouse,
 * suppresses the click, otherwise lets a quick tap call onTap. */
function useLongPress(onLongPress, onTap, ms = 450) {
  const timer = useRef(null);
  const fired = useRef(false);

  const start = (e) => {
    fired.current = false;
    timer.current = setTimeout(() => {
      fired.current = true;
      onLongPress?.(e);
    }, ms);
  };
  const cancel = () => clearTimeout(timer.current);
  const release = (e) => {
    clearTimeout(timer.current);
    if (!fired.current) onTap?.(e);
  };

  return {
    onMouseDown: start,
    onMouseUp: release,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: release,
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

/* Detail modal — shows every captured field for one booking. Portalled
 * to <body> so it escapes any transformed ancestor. */
function LogDetail({ log, onClose, onDelete }) {
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

  if (!log) return null;

  const fields = [
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
          <span className="log-modal-eyebrow">Booking detail</span>
          <h3>{log.name || 'Anonymous booking'}</h3>
          <p>{log.topic || 'Untitled topic'}</p>
        </div>
        <dl className="log-modal-grid">
          {fields.map(([k, v]) => (
            <div key={k} className="log-modal-row">
              <dt>{k}</dt>
              <dd>{v ? String(v) : <span className="muted">—</span>}</dd>
            </div>
          ))}
        </dl>
        <div className="log-modal-actions">
          <button type="button" className="topbar-btn" onClick={onClose}>Close</button>
          <button type="button" className="topbar-btn danger" onClick={() => { onDelete(log.id); onClose(); }}>Delete booking</button>
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

  const [active, setActive] = useState(null);
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

  const sorted = [...allLogs].sort((a, b) => {
    const da = new Date((a.date || '') + 'T' + (a.time || '00:00')).getTime();
    const db = new Date((b.date || '') + 'T' + (b.time || '00:00')).getTime();
    return da - db;
  });

  const summary = allLogs.length === 0
    ? 'No bookings yet'
    : `${allLogs.length} booking${allLogs.length === 1 ? '' : 's'} — long-press a row for full details`;

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
          <span><strong>Long-press</strong> (or tap and hold) any row to see the full booking — description, email, end time, submitted at &amp; more.</span>
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
                  onOpen={() => setActive(l)}
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

      <LogDetail log={active} onClose={() => setActive(null)} onDelete={deleteOne} />
      <Toast {...toast} />
    </AdminLayout>
  );
}

function LogRow({ log, index, onOpen, onDelete }) {
  /* Long-press opens detail; quick tap also opens (so desktop users
   * who just want to click can do so). The delete button stops
   * propagation so it doesn't trigger row open. */
  const press = useLongPress(onOpen, onOpen);

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
