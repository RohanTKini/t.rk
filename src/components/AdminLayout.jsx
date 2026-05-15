import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import RkLogo from './RkLogo.jsx';

/* Selectors for every section we want to scroll-reveal across all admin pages.
 * Keep this list broad — it's class-scoped, so the only thing being affected
 * is the visual entrance of the matched node. */
const REVEAL_SELECTORS = [
  '.welcome-card',
  '.weather-card',
  '.stats-row > .stat-card',
  '.section-head',
  '.quick-grid > .quick-card',
  '.control-card',
  '.control-card > .control-row',
  '.blocker-panel',
  '.blocker-panel .blocked-item',
  '.admin-form-card',
  '.admin-list-card',
  '.gallery-admin-grid > *',
  '.logs-table-wrap',
  '.logs-table tbody tr',
  '.hint-banner',
  '.admin-actions-bar'
].join(', ');

export default function AdminLayout({ title, subtitle, headerRight, children }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* Auto scroll-reveal every section in every admin page.
   *
   * Mounted ONCE for the life of the admin shell (deps: []), never torn down
   * on child re-renders. A MutationObserver picks up sections that mount
   * later — async store data on first login, toggled panels, new gallery
   * items, freshly added blocked dates, or a route change to another admin
   * page. Re-scans on a few timers guard against the first-login race where
   * the dashboard paints before Firebase data arrives. */
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const revealInView = () => {
      root.querySelectorAll('.admin-reveal:not(.is-visible)').forEach(n => n.classList.add('is-visible'));
    };

    if (typeof IntersectionObserver === 'undefined') {
      root.querySelectorAll(REVEAL_SELECTORS).forEach(n => n.classList.add('admin-reveal'));
      revealInView();
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -32px 0px' });

    /* Tag any new sections, reveal whatever is already in view, observe the
     * rest. Re-evaluates nodes that were tagged but not yet revealed, so a
     * recreated DOM (route change) or late data never leaves a blank panel. */
    const scan = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      root.querySelectorAll(REVEAL_SELECTORS).forEach(node => {
        if (node.classList.contains('is-visible')) return;
        node.classList.add('admin-reveal');
        const r = node.getBoundingClientRect();
        if (r.top < vh * 0.96 && r.bottom > 0) {
          node.classList.add('is-visible');
        } else if (!node.dataset.ioWatched) {
          node.dataset.ioWatched = '1';
          io.observe(node);
        }
      });
    };

    let raf = 0;
    const queueScan = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    };

    scan();
    const timers = [120, 400, 900, 1800].map(ms => setTimeout(scan, ms));

    const mo = new MutationObserver(queueScan);
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  function logout() {
    sessionStorage.removeItem('rk_admin_auth');
    navigate('/admin');
  }

  const Item = ({ to, icon, children }) => (
    <NavLink to={to} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
      onClick={() => setOpen(false)} end>
      {icon}
      {children}
    </NavLink>
  );

  const ICONS = {
    dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
    content: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    exp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    products: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    gallery: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    socials: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    logs: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  };

  return (
    <div className="admin-shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)}></div>}

      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <RkLogo size={36} />
          <div className="admin-brand-text">
            <strong>Rohan Kini</strong>
            <small>admin panel</small>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <nav className="admin-nav">
          <Item to="/admin/dashboard" icon={ICONS.dashboard}>Dashboard</Item>
          <Item to="/admin/content"   icon={ICONS.content}>Edit Content</Item>
          <Item to="/admin/experience" icon={ICONS.exp}>Experience</Item>
          <Item to="/admin/products"  icon={ICONS.products}>Products</Item>
          <Item to="/admin/gallery"   icon={ICONS.gallery}>Gallery</Item>
          <Item to="/admin/socials"   icon={ICONS.socials}>Social Links</Item>
          <Item to="/admin/logs"      icon={ICONS.logs}>Booking Log</Item>
          <Link to="/" target="_blank" rel="noopener noreferrer" className="admin-nav-item">
            {ICONS.user}
            View Public Site
          </Link>
        </nav>
        <div className="admin-footer">
          <button className="admin-logout" onClick={logout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          {headerRight}
        </header>
        <main className="admin-content" ref={contentRef}>
          {children}
        </main>
      </div>
    </div>
  );
}
