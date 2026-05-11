import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import Toast from '../components/Toast.jsx';
import { Store } from '../lib/store.js';
import { formatDateShort, todayISO } from '../lib/helpers.js';
import { useRevealAll } from '../lib/useReveal.js';

function timeAgo(iso) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} day${Math.floor(sec / 86400) === 1 ? '' : 's'} ago`;
}

export default function Dashboard() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => {
    const unsub = Store.subscribe(setState);
    return () => unsub();
  }, []);
  useRevealAll([state.settings?.tempDisabled, state.settings?.permDisabled]);

  const settings = state.settings || {};
  const permDisabled = settings.permDisabled === true;
  const tempDisabled = settings.tempDisabled === true;
  const blockedDates = Array.isArray(settings.blockedDates) ? settings.blockedDates : [];
  const locationMode = settings.locationMode || null;
  const customLocation = settings.customLocation || null;
  const allLogs = Array.isArray(state.logs) ? state.logs : [];

  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('Meeting');
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState({ msg: '', show: false });
  const showToast = (m) => {
    setToast({ msg: m, show: true });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const stats = useMemo(() => {
    const total = allLogs.length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const week = allLogs.filter(l => l.submittedAt && new Date(l.submittedAt).getTime() >= weekAgo).length;
    return {
      total, week,
      products: (state.products || []).length,
      gallery:  (state.gallery || []).length,
      experiences: (state.experiences || []).length
    };
  }, [allLogs, state]);

  function togglePerm() {
    const next = !permDisabled;
    Store.setSettings({ permDisabled: next, tempDisabled: next ? false : tempDisabled, blockedDates });
    showToast(next ? 'Bookings paused' : 'Bookings resumed');
  }
  function toggleTemp() {
    if (permDisabled) return;
    const next = !tempDisabled;
    Store.setSettings({ permDisabled, tempDisabled: next, blockedDates });
    showToast(next ? 'Date blocking ON — add dates below' : 'Date blocking OFF');
  }
  function addBlocked() {
    if (!blockDate) { showToast('Please select a date to block'); return; }
    if (blockedDates.find(d => d.date === blockDate)) { showToast('This date is already blocked'); return; }
    const next = [...blockedDates, { date: blockDate, reason: blockReason }];
    Store.setSettings({ permDisabled, tempDisabled, blockedDates: next });
    showToast(`${formatDateShort(blockDate)} blocked (${blockReason})`);
    setBlockDate('');
  }
  function removeBlocked(idx) {
    const removed = blockedDates[idx];
    Store.setSettings({ permDisabled, tempDisabled, blockedDates: blockedDates.filter((_, i) => i !== idx) });
    showToast(`Removed: ${formatDateShort(removed.date)}`);
  }
  function toggleLocation(mode) {
    const next = locationMode === mode ? null : mode;
    Store.setSettings({ permDisabled, tempDisabled, blockedDates, locationMode: next, customLocation });
    showToast(
      next === 'default' ? 'Showing base location' :
      next === 'custom'  ? (customLocation ? 'Switched to custom location' : 'Custom mode ON — capture location below')
                         : 'Location hidden'
    );
  }
  async function captureCurrentLocation() {
    if (capturing) return;
    setCapturing(true); showToast('Getting your location…');
    try {
      const pos = await new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) return reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000 });
      });
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        if (r.ok) { const d = await r.json(); address = d.display_name || address; }
      } catch {}
      Store.setSettings({
        permDisabled, tempDisabled, blockedDates,
        locationMode: 'custom',
        customLocation: { lat, lng, address, capturedAt: new Date().toISOString() }
      });
      showToast('Location captured');
    } catch (e) {
      showToast(e.message || 'Could not capture location');
    } finally {
      setCapturing(false);
    }
  }
  function clearCustomLocation() {
    Store.setSettings({
      permDisabled, tempDisabled, blockedDates,
      locationMode: locationMode === 'custom' ? null : locationMode,
      customLocation: null
    });
    showToast('Cleared captured location');
  }

  const status = permDisabled
    ? { dot: 'status-dot status-dot-red', label: 'Paused', sub: 'all bookings off' }
    : (tempDisabled && blockedDates.length > 0)
      ? { dot: 'status-dot status-dot-amber', label: 'Partial', sub: `${blockedDates.length} date(s) blocked` }
      : { dot: 'status-dot status-dot-green', label: 'Open', sub: 'accepting slots' };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const QUICK_LINKS = [
    { to: '/admin/content',   icon: '✎', label: 'Edit hero, about, expertise', title: 'Portfolio Content' },
    { to: '/admin/experience',icon: '◆', label: 'Add or edit roles & ventures', title: 'Experience' },
    { to: '/admin/products',  icon: '◊', label: 'Manage products & launches',   title: 'Products' },
    { to: '/admin/gallery',   icon: '▣', label: 'Add gallery images & captions', title: 'Gallery' },
    { to: '/admin/socials',   icon: '↗', label: 'Edit social media links',      title: 'Social Links' },
    { to: '/admin/logs',      icon: '☰', label: 'Review booking submissions',   title: 'Booking Log' }
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle={today}
      headerRight={<span className="admin-chip"><span className="dot"></span>rohan</span>}>
      <div className="welcome-card">
        <div className="welcome-avatar">RK</div>
        <div className="welcome-text">
          <h2>Welcome back, Rohan</h2>
          <p>Manage every part of your portfolio — content, experience, products, gallery, social links and bookings — from one place.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card reveal delay-1">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">all time</div>
        </div>
        <div className="stat-card reveal delay-2">
          <div className="stat-label">This Week</div>
          <div className="stat-value">{stats.week}</div>
          <div className="stat-sub">last 7 days</div>
        </div>
        <div className="stat-card reveal delay-3">
          <div className="stat-label">Products</div>
          <div className="stat-value">{stats.products}</div>
          <div className="stat-sub">on portfolio</div>
        </div>
        <div className="stat-card reveal delay-4">
          <div className="stat-label">Gallery</div>
          <div className="stat-value">{stats.gallery}</div>
          <div className="stat-sub">images live</div>
        </div>
        <div className="stat-card reveal delay-5">
          <div className="stat-label">Booking Status</div>
          <div className="stat-value" style={{ fontSize: 18, marginTop: 4, display: 'flex', alignItems: 'center' }}>
            <span className={status.dot}></span>{status.label}
          </div>
          <div className="stat-sub">{status.sub}</div>
        </div>
      </div>

      <div className="section-head"><div className="admin-section-title">Quick Actions</div></div>
      <div className="quick-grid">
        {QUICK_LINKS.map((q, i) => (
          <Link key={q.to} to={q.to} className={`quick-card reveal delay-${(i % 5) + 1}`}>
            <div className="quick-icon">{q.icon}</div>
            <div>
              <div className="quick-title">{q.title}</div>
              <div className="quick-desc">{q.label}</div>
            </div>
            <svg className="quick-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        ))}
      </div>

      <div className="section-head"><div className="admin-section-title">Availability Controls</div></div>

      <div className="control-card reveal">
        <div className="control-row">
          <div className="control-info">
            <div className="control-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -4, marginRight: 6, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Pause All Bookings
            </div>
            <div className="control-desc">Disables the booking form. Visitors see a "Bookings Paused" notice. Date blocking is unavailable while this is on.</div>
          </div>
          <div className="toggle-wrap">
            <div className={`toggle danger ${permDisabled ? 'on' : ''}`} onClick={togglePerm}></div>
          </div>
        </div>

        <div className="control-row">
          <div className="control-info">
            <div className="control-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -4, marginRight: 6, flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Block Specific Dates
            </div>
            <div className="control-desc">Block specific dates when you're unavailable. Visitors see a warning if they try to book then.</div>
          </div>
          <div className="toggle-wrap">
            <div className={`toggle ${tempDisabled && !permDisabled ? 'on' : ''} ${permDisabled ? 'disabled-toggle' : ''}`} onClick={toggleTemp}></div>
          </div>
        </div>

        {tempDisabled && !permDisabled && (
          <div className="blocker-panel">
            <div className="panel-title">Block a Date</div>
            <div className="blocker-row">
              <div className="blocker-field">
                <label>Date to block</label>
                <input type="date" min={todayISO()} value={blockDate} onChange={e => setBlockDate(e.target.value)} />
              </div>
              <div className="blocker-field">
                <label>Reason</label>
                <select value={blockReason} onChange={e => setBlockReason(e.target.value)}>
                  <option value="Meeting">Meeting</option>
                  <option value="Out of Station">Out of Station</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="blocker-field" style={{ flex: 0 }}>
                <label style={{ opacity: 0 }}>Add</label>
                <button className="btn btn-primary" onClick={addBlocked} style={{ padding: '10px 18px', fontSize: 13, whiteSpace: 'nowrap' }}>+ Block Date</button>
              </div>
            </div>

            <div className="blocked-list">
              {blockedDates.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '6px 0' }}>No dates blocked yet. Add one above.</div>
              ) : blockedDates.map((item, i) => (
                <div key={i} className="blocked-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-hover)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13.5 }}>{formatDateShort(item.date)}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{item.reason}</div>
                    </div>
                  </div>
                  <button className="blocked-item-remove" onClick={() => removeBlocked(i)} title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="section-head" style={{ marginTop: 8 }}>
        <div className="admin-section-title">Location on Schedule Page</div>
      </div>

      <div className="control-card reveal">
        <div className="control-row">
          <div className="control-info">
            <div className="control-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Default — Base location
            </div>
            <div className="control-desc">Shows your saved address (edit it under "Edit Content"). Custom mode turns off automatically.</div>
          </div>
          <div className="toggle-wrap">
            <div className={`toggle ${locationMode === 'default' ? 'on' : ''}`} onClick={() => toggleLocation('default')}></div>
          </div>
        </div>

        <div className="control-row">
          <div className="control-info">
            <div className="control-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--silver-500)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              Custom — capture from this device
            </div>
            <div className="control-desc">Pin where you are right now (handy when travelling). Visitors see the pin on the booking page.</div>
          </div>
          <div className="toggle-wrap">
            <div className={`toggle ${locationMode === 'custom' ? 'on' : ''}`} onClick={() => toggleLocation('custom')}></div>
          </div>
        </div>

        {locationMode === 'custom' && (
          <div className="blocker-panel">
            <div className="panel-title">Captured location</div>
            {customLocation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>{customLocation.address}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    {customLocation.lat.toFixed(5)}, {customLocation.lng.toFixed(5)}
                    {customLocation.capturedAt && ` · captured ${timeAgo(customLocation.capturedAt)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={captureCurrentLocation} disabled={capturing} style={{ padding: '10px 16px', fontSize: 13 }}>
                    {capturing ? 'Capturing…' : 'Refresh location'}
                  </button>
                  <button className="topbar-btn danger" onClick={clearCustomLocation} style={{ padding: '10px 16px', fontSize: 13 }}>Clear</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>No location captured yet. Click below — your browser will ask for permission.</p>
                <button className="btn btn-primary" onClick={captureCurrentLocation} disabled={capturing} style={{ padding: '11px 18px', fontSize: 13.5, alignSelf: 'flex-start' }}>
                  {capturing ? 'Capturing…' : 'Capture my current location'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Toast {...toast} />
    </AdminLayout>
  );
}
