import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';
import RkLogo from '../components/RkLogo.jsx';

/* Bento sizing rotation — gives the mosaic visual rhythm without
 * needing the admin to set sizes. Anchors to index, so reordering
 * in admin reorders the bento. */
const PATTERN = ['lg', 'sm', 'sm', 'wide', 'sm', 'tall', 'sm', 'sm', 'wide', 'sm', 'sm'];
const sizeFor = (i) => PATTERN[i % PATTERN.length];

export default function Gallery() {
  const [state, setState] = useState(Store.getState());
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsub = Store.subscribe(setState);
    return () => unsub();
  }, []);

  const gallery = state.gallery || [];
  useRevealAll([gallery.length, filter]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setActive(null); }
    if (active) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active]);

  /* Build a "with-location" filter list — every distinct location word.
   * Keeps things simple so the admin doesn't have to manage tags. */
  const locations = Array.from(new Set(gallery.map(g => (g.location || '').split('·')[0].trim()).filter(Boolean)));
  const filtered = filter === 'all' ? gallery : gallery.filter(g => (g.location || '').toLowerCase().startsWith(filter.toLowerCase()));

  return (
    <div className="gal">
      <nav className="sched-bar">
        <Link to="/" className="sched-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Portfolio
        </Link>
        <div className="sched-brandline">
          <RkLogo size={32} />
          <span>Gallery</span>
        </div>
        <Link to="/schedule" className="status-pill-mini link">Book a slot →</Link>
      </nav>

      <header className="gal-hero">
        <div className="gal-hero-inner">
          <span className="section-tag">— Visual archive —</span>
          <h1 className="huge-h">
            Works, achievements<br/>&amp; <em>moments worth keeping.</em>
          </h1>
          <p className="lead-text">
            A growing collection — captured across ventures, milestones and meaningful chapters.
            <span className="count-bdg">{gallery.length} images</span>
          </p>
        </div>
        <div className="gal-watermark">RK · GALLERY · {new Date().getFullYear()}</div>
      </header>

      {locations.length > 1 && (
        <div className="gal-filters">
          <button className={`fchip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All <span>{gallery.length}</span>
          </button>
          {locations.map((loc, i) => {
            const count = gallery.filter(g => (g.location || '').toLowerCase().startsWith(loc.toLowerCase())).length;
            return (
              <button key={i} className={`fchip ${filter === loc ? 'active' : ''}`} onClick={() => setFilter(loc)}>
                {loc} <span>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <main className="gal-bento">
        {filtered.length === 0 ? (
          <div className="empty-block">
            <RkLogo size={64} />
            <h3>{gallery.length === 0 ? 'Gallery coming soon' : 'No images for this filter'}</h3>
            <p>{gallery.length === 0 ? 'Curating works, achievements and moments. Check back shortly.' : 'Try another category.'}</p>
            {gallery.length === 0 && <Link to="/" className="btn btn-line">Back to portfolio</Link>}
          </div>
        ) : filtered.map((g, i) => (
          <button
            key={g.id || i}
            className={`bento-pic size-${sizeFor(i)} reveal delay-${(i % 5) + 1}`}
            onClick={() => setActive(g)}>
            <img src={g.image} alt={g.caption || g.location || 'Gallery item'} loading="lazy" />
            <span className="bp-num">{String(i + 1).padStart(2, '0')}</span>
            <div className="bp-overlay">
              {g.location && (
                <div className="bp-loc">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {g.location}
                </div>
              )}
              {g.caption && <div className="bp-cap">{g.caption}</div>}
              <div className="bp-cta">Open ↗</div>
            </div>
          </button>
        ))}
      </main>

      {active && (
        <div className="lbox" onClick={() => setActive(null)}>
          <button className="lbox-x" onClick={() => setActive(null)} aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="lbox-card" onClick={(e) => e.stopPropagation()}>
            <div className="lbox-img">
              <img src={active.image} alt={active.caption || active.location || 'Gallery item'} />
            </div>
            {(active.location || active.caption) && (
              <div className="lbox-meta">
                {active.location && (
                  <div className="lbox-loc">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {active.location}
                  </div>
                )}
                {active.caption && <p>{active.caption}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="sched-footer">
        <p>© {new Date().getFullYear()} Rohan Kini · <Link to="/">Back to portfolio</Link></p>
        <p>Designed and Developed by T Rohan Kini</p>
      </footer>
    </div>
  );
}
