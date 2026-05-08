import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';
import {
  WHATSAPP_NUMBER,
  formatDate, formatTime12, computeDuration,
  checkDate, checkTime, checkEndAfterStart, todayISO
} from '../lib/helpers.js';
import RkLogo from '../components/RkLogo.jsx';
import Toast from '../components/Toast.jsx';

const DEFAULT_ADDRESS = 'Mangaluru, Karnataka, India';
const MODES = ['In-person', 'Conference / Online Meeting', 'Visit', 'Event / Activity'];

export default function Schedule() {
  const [state, setState] = useState(Store.getState());
  useEffect(() => { const u = Store.subscribe(setState); return () => u(); }, []);
  useRevealAll([state.settings?.permDisabled]);

  const settings = state.settings || {};
  const content = state.content || {};
  const permDisabled = settings.permDisabled === true;
  const tempDisabled = settings.tempDisabled === true;
  const blockedDates = (tempDisabled && Array.isArray(settings.blockedDates)) ? settings.blockedDates : [];

  const address = content.address || DEFAULT_ADDRESS;
  const locationMode = settings.locationMode || null;
  const customLocation = settings.customLocation || null;
  const showLocation =
    locationMode === 'default' ||
    (locationMode === 'custom' && customLocation && typeof customLocation.lat === 'number');
  const isCustom = locationMode === 'custom' && customLocation;
  const displayAddress = isCustom ? customLocation.address : address;
  const mapQuery = isCustom ? `${customLocation.lat},${customLocation.lng}` : address;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [desc, setDesc] = useState('');
  const [mode, setMode] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const [popup, setPopup] = useState(null);
  const [toast, setToast] = useState({ msg: '', show: false });
  const showToast = (m) => {
    setToast({ msg: m, show: true });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const validation = useMemo(() => {
    const dr = checkDate(date, blockedDates); if (!dr.ok) return dr;
    const sr = checkTime(start, 'start time'); if (!sr.ok) return sr;
    const er = checkTime(end, 'end time'); if (!er.ok) return er;
    const or = checkEndAfterStart(start, end); if (!or.ok) return or;
    return { ok: true };
  }, [date, start, end, blockedDates]);

  function onDateChange(v) {
    setDate(v);
    const r = checkDate(v, blockedDates);
    if (!r.ok) setPopup(r);
  }
  function onStartChange(v) {
    setStart(v);
    const r = checkTime(v, 'start time');
    if (!r.ok) { setPopup(r); return; }
    const order = checkEndAfterStart(v, end);
    if (!order.ok) setPopup(order);
  }
  function onEndChange(v) {
    setEnd(v);
    const r = checkTime(v, 'end time');
    if (!r.ok) { setPopup(r); return; }
    const order = checkEndAfterStart(start, v);
    if (!order.ok) setPopup(order);
  }

  function handleSubmit() {
    if (!name.trim() || !phone.trim() || !topic.trim() || !mode || !date || !start || !end) {
      showToast('Please fill all required fields'); return;
    }
    const dr = checkDate(date, blockedDates); if (!dr.ok) { setPopup(dr); return; }
    const sr = checkTime(start, 'start time'); if (!sr.ok) { setPopup(sr); return; }
    const er = checkTime(end, 'end time'); if (!er.ok) { setPopup(er); return; }
    const or = checkEndAfterStart(start, end); if (!or.ok) { setPopup(or); return; }

    const duration = computeDuration(start, end);
    const entry = {
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      name: name.trim(), phone: phone.trim(), email: email.trim(),
      topic: topic.trim(), desc: desc.trim(),
      mode, date, time: start, endTime: end, duration
    };
    Store.appendLog(entry);

    const msg = [
      '*New Booking Request*', '',
      `*Name:* ${entry.name}`,
      `*Phone:* ${entry.phone}`,
      entry.email ? `*Email:* ${entry.email}` : null,
      `*Topic:* ${entry.topic}`,
      entry.desc ? `*Description:* ${entry.desc}` : null,
      `*Mode:* ${entry.mode}`,
      `*Date:* ${formatDate(date)}`,
      `*Time:* ${formatTime12(start)} – ${formatTime12(end)}`,
      `*Duration:* ${duration}`,
      '', 'Awaiting your confirmation. Thank you!'
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    showToast('Opening WhatsApp…');
  }

  const stepDone = {
    1: !!(name && phone),
    2: !!(topic && mode),
    3: !!(date && start && end)
  };

  return (
    <div className="sched">
      <nav className="sched-bar">
        <Link to="/" className="sched-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Portfolio
        </Link>
        <div className="sched-brandline">
          <RkLogo size={32} />
          <span>Schedule a slot</span>
        </div>
        {permDisabled
          ? <span className="status-pill-mini danger">● Paused</span>
          : (tempDisabled && blockedDates.length > 0)
            ? <span className="status-pill-mini warning">● Limited</span>
            : <span className="status-pill-mini success">● Open</span>
        }
      </nav>

      {permDisabled ? (
        <div className="paused-shell reveal">
          <div className="paused-card">
            <div className="paused-mark">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
            <h2>Bookings paused</h2>
            <p>Rohan is not accepting new requests right now. Please check back later.</p>
            <Link to="/" className="btn btn-line">Back to portfolio</Link>
          </div>
        </div>
      ) : (
        <div className="sched-grid">
          {/* LEFT — info column */}
          <aside className="sched-side">
            <div className="side-hero reveal">
              <div className="side-portrait"><img src="/rohan.jpeg" alt="Rohan Kini" /></div>
              <h1>Book a slot<br/>with <em>Rohan Kini</em></h1>
              <p>Schedule a one-on-one — about ideas, ventures, partnerships, or anything in between.</p>
            </div>

            <div className="side-banner reveal">
              {tempDisabled && blockedDates.length > 0 ? (
                <>
                  <span className="dot warning" />
                  <span><strong>Limited dates.</strong> Some days are blocked — check before picking.</span>
                </>
              ) : (
                <>
                  <span className="dot success" />
                  <span><strong>Mon – Sat · 9 AM – 9 PM.</strong> Sundays are holidays.</span>
                </>
              )}
            </div>

            <div className="side-steps reveal delay-1">
              <div className="step-title">How it works</div>
              <div className={`step ${stepDone[1] ? 'done' : ''}`}>
                <span className="step-n">01</span>
                <div>
                  <strong>Tell Rohan who you are</strong>
                  <span>Name, phone, optional email.</span>
                </div>
              </div>
              <div className={`step ${stepDone[2] ? 'done' : ''}`}>
                <span className="step-n">02</span>
                <div>
                  <strong>Pick the topic</strong>
                  <span>Mode of meeting + a short brief.</span>
                </div>
              </div>
              <div className={`step ${stepDone[3] ? 'done' : ''}`}>
                <span className="step-n">03</span>
                <div>
                  <strong>Choose date &amp; time</strong>
                  <span>Validates working hours instantly.</span>
                </div>
              </div>
              <div className="step">
                <span className="step-n">04</span>
                <div>
                  <strong>Send via WhatsApp</strong>
                  <span>Pre-filled message — just tap send.</span>
                </div>
              </div>
            </div>

            {showLocation && (
              <div className="side-location reveal delay-2">
                <div className="step-title">{isCustom ? 'Currently here' : 'Based in'}</div>
                <div className="loc-mapsmall">
                  <iframe title="map" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <p className="loc-text">{displayAddress}</p>
                <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-sm">
                  Get directions →
                </a>
              </div>
            )}
          </aside>

          {/* RIGHT — staged form */}
          <main className="sched-main">
            {!validation.ok && (
              <div className="warn-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                {validation.message}
              </div>
            )}

            <section className="stage reveal">
              <div className="stage-head">
                <span className="stage-num">01</span>
                <h3>About you</h3>
              </div>
              <div className="stage-body">
                <div className="rk-field">
                  <label>Full name <span className="req">*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="rk-row">
                  <div className="rk-field">
                    <label>Phone <span className="req">*</span></label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="rk-field">
                    <label>Email (optional)</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
                  </div>
                </div>
              </div>
            </section>

            <section className="stage reveal delay-1">
              <div className="stage-head">
                <span className="stage-num">02</span>
                <h3>What's it about</h3>
              </div>
              <div className="stage-body">
                <div className="rk-field">
                  <label>Topic <span className="req">*</span></label>
                  <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Partnership, mentorship, investment…" />
                </div>
                <div className="rk-field">
                  <label>Description</label>
                  <textarea rows="3" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief context — what you'd like to discuss." />
                </div>
                <div className="rk-field">
                  <label>Preferred mode <span className="req">*</span></label>
                  <div className="mode-pick">
                    {MODES.map(m => (
                      <button type="button" key={m}
                        className={`mode-chip ${mode === m ? 'active' : ''}`}
                        onClick={() => setMode(m)}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="stage reveal delay-2">
              <div className="stage-head">
                <span className="stage-num">03</span>
                <h3>When works for you</h3>
              </div>
              <div className="stage-body">
                <div className="rk-field">
                  <label>Date <span className="req">*</span></label>
                  <input type="date" min={todayISO()} value={date} onChange={e => onDateChange(e.target.value)} />
                </div>
                <div className="rk-row">
                  <div className="rk-field">
                    <label>Start <span className="req">*</span></label>
                    <input type="time" min="09:00" max="21:00" value={start} onChange={e => onStartChange(e.target.value)} />
                  </div>
                  <div className="rk-field">
                    <label>End <span className="req">*</span></label>
                    <input type="time" min="09:00" max="21:00" value={end} onChange={e => onEndChange(e.target.value)} />
                  </div>
                </div>
                {start && end && validation.ok && (
                  <div className="dur-pill">Duration: {computeDuration(start, end)}</div>
                )}
              </div>
            </section>

            <div className="submit-row-v2 reveal delay-3">
              <button className="btn btn-primary big" disabled={!validation.ok} onClick={handleSubmit}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Submit &amp; Open WhatsApp
              </button>
              <p className="submit-fine">Your details open pre-filled in WhatsApp. Just hit send to confirm.</p>
            </div>
          </main>
        </div>
      )}

      <footer className="sched-footer">
        <p>© {new Date().getFullYear()} Rohan Kini · <Link to="/">Back to portfolio</Link></p>
        <p>Designed and Developed by T Rohan Kini</p>
      </footer>

      {popup && createPortal(
        <div className="popup">
          <div className="popup-bg" onClick={() => setPopup(null)} />
          <div className="popup-card">
            <div className="popup-mark">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3>{popup.title}</h3>
            <p>{popup.message}</p>
            <button className="btn btn-primary" onClick={() => setPopup(null)}>Got it</button>
          </div>
        </div>,
        document.body
      )}

      <Toast {...toast} />
    </div>
  );
}
