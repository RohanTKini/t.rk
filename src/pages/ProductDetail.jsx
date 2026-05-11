import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';
import { formatMonthYear } from '../lib/helpers.js';
import RkLogo from '../components/RkLogo.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(Store.getState());

  useEffect(() => {
    const unsub = Store.subscribe(setState);
    return () => unsub();
  }, []);

  const products = state.products || [];
  const product = products.find(p => String(p.id) === String(id));
  const otherProducts = products.filter(p => String(p.id) !== String(id)).slice(0, 3);

  useRevealAll([product?.id]);

  /* 404 — product wasn't found in the store (deleted, bad URL, etc.) */
  if (!product) {
    return (
      <div className="pdetail">
        <nav className="sched-bar">
          <Link to="/" className="sched-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Portfolio
          </Link>
          <div className="sched-brandline">
            <RkLogo size={32} />
            <span>Product</span>
          </div>
        </nav>
        <div className="pd-404">
          <RkLogo size={72} />
          <h1>Product Under Construction</h1>
          <p>This product hasn't been added yet — Rohan is curating new ventures. Check back shortly.</p>
          <div className="pd-404-actions">
            <Link to="/" className="btn btn-primary">Back to portfolio</Link>
            <button className="btn btn-line" onClick={() => navigate(-1)}>Go back</button>
          </div>
        </div>
      </div>
    );
  }

  const hasImage = product.image && product.image.trim().length > 0;
  const techStack = Array.isArray(product.techStack) ? product.techStack : [];
  const features  = Array.isArray(product.features) ? product.features : [];
  const subGallery = Array.isArray(product.gallery) ? product.gallery : [];

  return (
    <div className="pdetail">
      <nav className="sched-bar">
        <Link to="/#products" className="sched-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          All products
        </Link>
        <div className="sched-brandline">
          <RkLogo size={32} />
          <span>Product</span>
        </div>
        {product.status && <span className="status-pill-mini link">{product.status}</span>}
      </nav>

      {/* HERO */}
      <header className="pd-hero">
        <div className="pd-hero-inner">
          <div className="pd-hero-text reveal from-left">
            <span className="section-tag">— Product · {String(product.id || '').toUpperCase()} —</span>
            <h1 className="huge-h">
              {product.name}
            </h1>
            {product.tagline && <p className="pd-tagline">{product.tagline}</p>}
            <div className="pd-hero-meta">
              {product.status && <span className="pd-chip primary">● {product.status}</span>}
              {product.launchDate && <span className="pd-chip">Launched {formatMonthYear(product.launchDate)}</span>}
              {techStack.length > 0 && <span className="pd-chip muted">{techStack.length} tech tools</span>}
            </div>
            <div className="pd-hero-cta">
              {product.link
                ? <a href={product.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    Visit project
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                  </a>
                : <span className="btn btn-line" style={{ opacity: 0.6, cursor: 'default' }}>Link coming soon</span>}
              <Link to="/#products" className="btn btn-line">More products</Link>
            </div>
          </div>
          <div className="pd-hero-art reveal from-right">
            {hasImage
              ? <img src={product.image} alt={product.name} />
              : <div className="pd-hero-fallback"><RkLogo size={96} /><span>Image coming soon</span></div>}
            <span className="pd-hero-tag">{String(products.findIndex(p => p.id === product.id) + 1).padStart(2, '0')}</span>
          </div>
        </div>
      </header>

      {/* OVERVIEW + FEATURES + TECH */}
      <section className="pd-body container">
        <div className="pd-grid">
          <article className="pd-block reveal">
            <span className="pd-eyebrow">01 / Overview</span>
            <h2 className="pd-h2">What it is, in plain words.</h2>
            {product.longDescription
              ? <p className="pd-prose">{product.longDescription}</p>
              : (product.description
                  ? <p className="pd-prose">{product.description}</p>
                  : <p className="pd-prose muted">A longer write-up is on the way. In the meantime — reach out if you'd like to chat about it.</p>)}
          </article>

          <article className="pd-block reveal delay-1">
            <span className="pd-eyebrow">02 / Key features</span>
            <h2 className="pd-h2">What's inside.</h2>
            {features.length > 0 ? (
              <ul className="pd-features">
                {features.map((f, i) => (
                  <li key={i}>
                    <span className="pd-fnum">{String(i + 1).padStart(2, '0')}</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pd-prose muted">Feature breakdown coming soon.</p>
            )}
          </article>

          <article className="pd-block reveal delay-2">
            <span className="pd-eyebrow">03 / Built with</span>
            <h2 className="pd-h2">Stack &amp; tools.</h2>
            {techStack.length > 0 ? (
              <div className="pd-tech">
                {techStack.map((t, i) => <span key={i} className="pd-tech-chip">{t}</span>)}
              </div>
            ) : (
              <p className="pd-prose muted">Tech stack will be listed once the build is finalised.</p>
            )}
          </article>

          <article className="pd-block reveal delay-3">
            <span className="pd-eyebrow">04 / Status</span>
            <h2 className="pd-h2">Where it stands.</h2>
            <div className="pd-status-card">
              <div className="pd-status-dot" />
              <div>
                <div className="pd-status-label">{product.status || 'In progress'}</div>
                <div className="pd-status-sub">
                  {product.launchDate
                    ? `Launch target — ${formatMonthYear(product.launchDate)}`
                    : 'Launch date to be announced.'}
                </div>
              </div>
            </div>
          </article>
        </div>

        {subGallery.length > 0 && (
          <div className="pd-gallery reveal">
            <span className="pd-eyebrow">05 / In motion</span>
            <h2 className="pd-h2">Glimpses from the build.</h2>
            <div className="pd-gallery-grid">
              {subGallery.map((src, i) => (
                <div key={i} className="pd-gallery-tile">
                  <img src={src} alt={`${product.name} — ${i + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* OTHER PRODUCTS */}
      {otherProducts.length > 0 && (
        <section className="pd-more">
          <div className="container">
            <div className="pd-more-head reveal">
              <span className="section-tag">— More from Rohan —</span>
              <h2 className="huge-h">Other <em>builds.</em></h2>
            </div>
            <div className="pd-more-grid">
              {otherProducts.map((p, i) => (
                <Link key={p.id} to={`/products/${p.id}`} className={`pd-more-card reveal delay-${(i % 3) + 1}`}>
                  {p.image
                    ? <div className="pd-more-img"><img src={p.image} alt={p.name} loading="lazy" /></div>
                    : <div className="pd-more-img"><RkLogo size={56} /></div>}
                  <div className="pd-more-body">
                    <div className="pd-more-name">{p.name || 'Untitled'}</div>
                    {p.tagline && <div className="pd-more-tag">{p.tagline}</div>}
                    <span className="pd-more-cta">View details →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="sched-footer">
        <p>© {new Date().getFullYear()} Rohan Kini · <Link to="/">Back to portfolio</Link></p>
        <p>Designed and Developed by T Rohan Kini</p>
      </footer>
    </div>
  );
}
