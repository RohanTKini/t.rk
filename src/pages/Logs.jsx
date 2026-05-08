import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import { Store } from '../lib/store.js';
import { formatDateShort, formatTime12 } from '../lib/helpers.js';
import { useRevealAll } from '../lib/useReveal.js';

export default function Logs() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => { const unsub = Store.subscribe(setState); return () => unsub(); }, []);
  const allLogs = Array.isArray(state.logs) ? state.logs : [];
  useRevealAll([allLogs.length]);

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
    : `${allLogs.length} booking${allLogs.length === 1 ? '' : 's'} — sorted soonest first`;

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
                <tr key={l.id}>
                  <td style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{l.name || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>{l.phone || '—'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-2)' }} title={l.topic}>{l.topic || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{l.mode ? <span className="chip" style={{ fontSize: 11 }}>{l.mode}</span> : <span style={{ color: 'var(--ink-3)' }}>—</span>}</td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{formatDateShort(l.date)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{formatTime12(l.time)}</td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{l.duration || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="row-delete" onClick={() => deleteOne(l.id)} title="Delete">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
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
      <Toast {...toast} />
    </AdminLayout>
  );
}
