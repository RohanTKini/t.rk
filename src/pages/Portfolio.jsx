import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Store } from '../lib/store.js';
import { useRevealAll } from '../lib/useReveal.js';
import { formatMonthYear } from '../lib/helpers.js';
import RkLogo from '../components/RkLogo.jsx';
import SmartImage from '../components/SmartImage.jsx';
import SocialIcon from '../components/SocialIcons.jsx';

function smoothScroll(e, id) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

/* Headline can contain literal "<em>...</em>" — render those as styled accents. */
function RichHeadline({ text }) {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    const parts = line.split(/(<em>.*?<\/em>)/g).filter(Boolean);
    return (
      <span key={idx} className="hl-line">
        {parts.map((p, i) => {
          const m = p.match(/^<em>(.*?)<\/em>$/);
          return m ? <em key={i}>{m[1]}</em> : <span key={i}>{p}</span>;
        })}
      </span>
    );
  });
}

/* ── CONTACT — single morphing form with chip toggle + side info column ── */
function ContactBlock({ businessEmail, personalEmail, phone, whatsapp }) {
  const [tab, setTab] = useState('business');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const isBusiness = tab === 'business';
  const email = isBusiness ? businessEmail : personalEmail;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true); setError(''); setDone(false);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries()))
      });
      if (!res.ok) throw new Error('Failed');
      setDone(true);
      form.reset();
    } catch {
      setError('Could not send. Please try again or email directly.');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="contact-split">
      <aside className="contact-aside reveal from-left">
        <span className="micro-label">Direct lines</span>
        <h3 className="contact-aside-title">Skip the form.<br/><em>Reach out.</em></h3>

        <a href={`mailto:${businessEmail}`} className="contact-tile">
          <div className="ct-icon">@</div>
          <div>
            <div className="ct-label">Business</div>
            <div className="ct-value">{businessEmail}</div>
          </div>
        </a>
        <a href={`mailto:${personalEmail}`} className="contact-tile">
          <div className="ct-icon">@</div>
          <div>
            <div className="ct-label">Personal</div>
            <div className="ct-value">{personalEmail}</div>
          </div>
        </a>
        <a href={`tel:${(phone || '').replace(/\s+/g, '')}`} className="contact-tile">
          <div className="ct-icon">☎</div>
          <div>
            <div className="ct-label">Phone</div>
            <div className="ct-value">{phone}</div>
          </div>
        </a>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="contact-tile whatsapp">
            <div className="ct-icon">✓</div>
            <div>
              <div className="ct-label">WhatsApp</div>
              <div className="ct-value">{phone}</div>
            </div>
          </a>
        )}
      </aside>

      <div className="contact-formwrap reveal from-right">
        <div className="form-toggle">
          <button type="button"
            className={`ftog ${isBusiness ? 'active' : ''}`}
            onClick={() => { setTab('business'); setDone(false); setError(''); }}>
            <span className="ftog-num">01</span> Business
          </button>
          <button type="button"
            className={`ftog ${!isBusiness ? 'active' : ''}`}
            onClick={() => { setTab('personal'); setDone(false); setError(''); }}>
            <span className="ftog-num">02</span> Personal
          </button>
          <span className={`ftog-glow ${isBusiness ? 'a' : 'b'}`} />
        </div>

        <form key={tab} className="rk-form" onSubmit={handleSubmit} autoComplete="off">
          <input type="hidden" name="_subject" value={`New ${isBusiness ? 'Business' : 'Personal'} enquiry — Rohan Kini`} />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="text" name="_honey" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
          <input type="hidden" name="enquiry_type" value={isBusiness ? 'Business' : 'Personal'} />

          <div className="rk-field">
            <label>Your name <span className="req">*</span></label>
            <input type="text" name="name" placeholder="Full name" required />
          </div>
          <div className="rk-row">
            <div className="rk-field">
              <label>Email <span className="req">*</span></label>
              <input type="email" name="email" placeholder="you@email.com" required />
            </div>
            <div className="rk-field">
              <label>Phone</label>
              <input type="tel" name="phone" placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          {isBusiness && (
            <div className="rk-field">
              <label>Company / Venture</label>
              <input type="text" name="company" placeholder="Organisation, startup or firm" />
            </div>
          )}
          <div className="rk-field">
            <label>{isBusiness ? 'Project brief' : 'Subject'}</label>
            <input type="text" name="subject" placeholder={isBusiness ? 'Partnership, investment, collaboration…' : 'What is this about?'} />
          </div>
          <div className="rk-field">
            <label>{isBusiness ? 'Scope & timelines' : 'Message'} <span className="req">*</span></label>
            <textarea name="message" rows="4" placeholder={isBusiness ? 'Tell Rohan about the engagement, scope and timelines…' : 'Drop Rohan a note…'} required />
          </div>

          {error && <div className="rk-feedback error">{error}</div>}
          {done && <div className="rk-feedback success">✓ Sent. Rohan will get back to you soon.</div>}

          <div className="rk-submit">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Sending…' : `Send ${isBusiness ? 'Business' : 'Personal'} Note`}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <span className="rk-route">routes to <code>{email}</code></span>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── PRODUCT — bento card with size variant; tapping opens detail page ── */
function ProductCard({ product, size = 'md', index }) {
  const hasImage = product.image && product.image.trim().length > 0;
  const hasName = product.name && product.name.trim().length > 0;
  const placeholder = !hasImage && !hasName;

  if (placeholder) {
    return (
      <div className={`bento-card placeholder size-${size}`}>
        <div className="bento-placeholder">
          <RkLogo size={72} />
          <div className="bp-title">Product Under Construction</div>
          <div className="bp-sub">A new venture is taking shape — stay tuned.</div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/products/${product.id}`} className={`bento-card size-${size}`}>
      <div className="bento-image">
        {hasImage
          ? <SmartImage src={product.image} alt={product.name || 'Product'} loading="lazy" fallbackSize={56} />
          : <div className="bento-fallback"><RkLogo size={56} /><span>Image coming soon</span></div>}
        {product.launchDate && <span className="bento-launch">{formatMonthYear(product.launchDate)}</span>}
        <span className="bento-num">{String(index + 1).padStart(2, '0')}</span>
        {product.status && <span className="bento-status">{product.status}</span>}
      </div>
      <div className="bento-body">
        <h3>{product.name || 'Untitled'}</h3>
        {product.tagline && <p className="bento-tagline">{product.tagline}</p>}
        {product.description
          ? <p>{product.description}</p>
          : <p className="muted">Description coming soon.</p>}
        <span className="bento-link">
          View details
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
        </span>
      </div>
    </Link>
  );
}

/* ── HORIZONTAL GALLERY STRIP ─────────────────────────────────────────── */
function GalleryStrip({ items }) {
  const railRef = useRef(null);

  function scroll(dir) {
    const el = railRef.current;
    if (!el) return;
    const w = el.clientWidth * 0.7;
    el.scrollBy({ left: dir * w, behavior: 'smooth' });
  }

  if (items.length === 0) {
    return (
      <div className="strip-empty">
        <RkLogo size={56} />
        <h3>Gallery coming soon</h3>
        <p>Captures from talks, ventures and milestones — on the way.</p>
      </div>
    );
  }

  return (
    <div className="hrail-wrap">
      <div className="hrail" ref={railRef}>
        {items.slice(0, 10).map((g, i) => (
          <Link key={g.id || i} to="/gallery" className={`hrail-card v-${i % 3}`}>
            <SmartImage src={g.image} alt={g.caption || g.location || 'Gallery'} loading="lazy" fallbackSize={48} />
            <div className="hrail-overlay">
              {g.location && (
                <div className="hrail-loc">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {g.location}
                </div>
              )}
              {g.caption && <div className="hrail-cap">{g.caption}</div>}
            </div>
            <span className="hrail-num">{String(i + 1).padStart(2, '0')}</span>
          </Link>
        ))}
        <Link to="/gallery" className="hrail-card view-all">
          <div className="va-inner">
            <span className="va-arrow">→</span>
            <span className="va-text">View<br/>full<br/>gallery</span>
          </div>
        </Link>
      </div>
      <div className="hrail-controls">
        <button className="hrail-btn" onClick={() => scroll(-1)} aria-label="Scroll left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className="hrail-btn" onClick={() => scroll(1)} aria-label="Scroll right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── PORTFOLIO PAGE ───────────────────────────────────────────────────── */
export default function Portfolio() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [state, setState] = useState(Store.getState());

  useEffect(() => {
    const unsub = Store.subscribe(setState);
    return () => unsub();
  }, []);

  useRevealAll([
    state.experiences?.length,
    state.products?.length,
    state.gallery?.length,
    state.socials?.length
  ]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const content = state.content || {};
  const experiences = state.experiences || [];
  const products = state.products || [];
  const gallery = state.gallery || [];
  const socials = state.socials || [];

  /* Bento sizing pattern: rotates large/wide/tall/small for visual rhythm. */
  const bentoSize = (i) => ['lg', 'md', 'wide', 'tall', 'md', 'sm'][i % 6];

  const productsRender = products.length > 0 ? products : [{ id: '_p' }];

  const whatsapp = (socials.find(s => (s.id || '').toLowerCase() === 'whatsapp')?.href || '').match(/(\d+)/g)?.join('') || '916361529586';

  return (
    <div className="rk-site">
      {/* NAV */}
      <nav className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <Link to="/" className="nav-brand">
          <RkLogo size={36} />
          <div className="nav-brand-text">
            <strong>Rohan Kini</strong>
            <small>Founder · Builder · Visionary</small>
          </div>
        </Link>
        <div className={`nav-mid ${navOpen ? 'open' : ''}`}>
          <a href="#about"      onClick={(e) => { setNavOpen(false); smoothScroll(e, 'about'); }}>About</a>
          <a href="#expertise"  onClick={(e) => { setNavOpen(false); smoothScroll(e, 'expertise'); }}>Expertise</a>
          <a href="#experience" onClick={(e) => { setNavOpen(false); smoothScroll(e, 'experience'); }}>Experience</a>
          <a href="#education"  onClick={(e) => { setNavOpen(false); smoothScroll(e, 'education'); }}>Education</a>
          <a href="#products"   onClick={(e) => { setNavOpen(false); smoothScroll(e, 'products'); }}>Products</a>
          <Link to="/gallery"   onClick={() => setNavOpen(false)}>Gallery</Link>
          <a href="#contact"    onClick={(e) => { setNavOpen(false); smoothScroll(e, 'contact'); }}>Contact</a>
        </div>
        <div className="nav-end">
          <Link to="/schedule" className="nav-cta-pill" onClick={() => setNavOpen(false)}>
            Book a Slot <span className="cta-arrow">→</span>
          </Link>
          <button className="nav-burger" onClick={() => setNavOpen(o => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* HERO — editorial split with circular portrait */}
      <section className="hero">
        <div className="hero-watermark">2026</div>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-meta">
              <span className="dot-live"><span /></span>
              <span>Open to collaborations</span>
              <span className="meta-sep">/</span>
              <span>{content.address || 'Mangaluru, India'}</span>
            </div>
            
            <h1 className="hero-headline">
              <RichHeadline text={content.hero?.headline} />
            </h1>
            <p className="hero-tag">{content.hero?.tagline}</p>
            <div className="hero-roles">
              {(content.hero?.roles || []).map((r, i) => (
                <span key={i} className="role-chip">
                  <span className="rc-num">0{i + 1}</span>{r}
                </span>
              ))}
            </div>
            <div className="hero-cta">
              <Link to="/schedule" className="btn btn-primary">
                Book a Conversation
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <a href="#contact" className="btn btn-line" onClick={(e) => smoothScroll(e, 'contact')}>Get in Touch</a>
            </div>
          </div>

          <div className="hero-right">
            <div className="portrait-wrap">
              <div className="portrait-ring" />
              <div className="portrait">
                <SmartImage src="/rohan.jpeg" alt="Rohan Kini" fallbackSize={96} />
              </div>
              <div className="floating-chip fc-1">
                <span className="fc-dot" /> Founder
              </div>
              <div className="floating-chip fc-2">
                ◆ Visionary
              </div>
              <div className="floating-chip fc-3">
                Mangaluru · IN
              </div>
            </div>
            <div className="hero-vertical">— ROHAN · KINI · 2026 —</div>
          </div>
        </div>
        <div className="hero-foot">
          <div>Scroll to explore</div>
          <div className="scroll-hint" />
        </div>
      </section>

      {/* TICKER STRIP — vertical pill chips replace marquee bar */}
      <div className="ticker">
        <div className="ticker-track">
          {['Vision', 'Innovation', 'Leadership', 'Future', 'Strategy', 'Collaboration', 'Discipline', 'Impact'].map((w, i) => (
            <span key={i} className="ticker-pill">
              <span className="tp-num">{String(i + 1).padStart(2, '0')}</span>{w}
            </span>
          ))}
          {['Vision', 'Innovation', 'Leadership', 'Future', 'Strategy', 'Collaboration', 'Discipline', 'Impact'].map((w, i) => (
            <span key={'b' + i} className="ticker-pill">
              <span className="tp-num">{String(i + 1).padStart(2, '0')}</span>{w}
            </span>
          ))}
        </div>
      </div>

      {/* ABOUT — quote-led editorial layout */}
      <section className="about" id="about">
        <div className="about-watermark">02</div>
        <div className="container">
          <div className="about-head reveal">
            <span className="section-tag">02 / About</span>
            <h2 className="huge-h">
              The mind<br/>behind <em>the mission.</em>
            </h2>
          </div>
          <div className="about-grid-v2">
            <aside className="about-quote-col reveal from-left">
              {content.about?.quote && (
                <div className="big-quote">
                  <span className="qmark">"</span>
                  <p>{content.about.quote}</p>
                </div>
              )}
              <div className="about-portrait">
                <SmartImage src="/leadership.png" alt="Rohan Kini — Leadership" fallbackSize={96} />
              </div>
            </aside>
            <div className="about-narrative reveal from-right">
              {(content.about?.paragraphs || []).map((p, i) => (
                <div key={i} className="narrative-block">
                  <span className="nb-num">{String(i + 1).padStart(2, '0')}</span>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="quick-stats">
            <div className="qs-item reveal delay-1">
              <div className="qs-key">Vision</div>
              <div className="qs-val">∞</div>
              <div className="qs-sub">limitless ambition</div>
            </div>
            <div className="qs-divider" />
            <div className="qs-item reveal delay-2">
              <div className="qs-key">Mindset</div>
              <div className="qs-val">Builder</div>
              <div className="qs-sub">future-focused</div>
            </div>
            <div className="qs-divider" />
            <div className="qs-item reveal delay-3">
              <div className="qs-key">Based in</div>
              <div className="qs-val">Mangaluru</div>
              <div className="qs-sub">Karnataka, India</div>
            </div>
            <div className="qs-divider" />
            <div className="qs-item reveal delay-4">
              <div className="qs-key">Reach</div>
              <div className="qs-val tiny">{content.phone}</div>
              <div className="qs-sub">{content.email1}</div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERTISE — vertical accordion-style stacked rows */}
      <section className="expertise" id="expertise">
        <div className="container">
          <div className="ex-head reveal">
            <span className="section-tag">03 / Expertise</span>
            <h2 className="huge-h">Three pillars,<br/><em>one mission.</em></h2>
          </div>
          <div className="ex-stack">
            {(content.expertise || []).map((ex, i) => (
              <div key={i} className={`ex-row reveal delay-${i + 1}`}>
                <div className="ex-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="ex-content">
                  <h3>{ex.title}</h3>
                  <p>{ex.desc}</p>
                </div>
                <div className="ex-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE — vertical center-spine timeline, alternating L/R */}
      <section className="exp" id="experience">
        <div className="container">
          <div className="exp-head reveal">
            <span className="section-tag">04 / Experience</span>
            <h2 className="huge-h">Roles &amp; ventures<br/>shaping the <em>journey.</em></h2>
            <p className="lead-text" style={{ marginTop: 16 }}>
              Each chapter — building skills, networks and the conviction to lead bigger ventures next.
            </p>
          </div>
          {experiences.length === 0 ? (
            <div className="empty-block">
              <RkLogo size={48} />
              <h3>Experience coming soon</h3>
              <p>Rohan is adding his roles. Check back shortly.</p>
            </div>
          ) : (
            <div className="exp-ledger">
              {experiences.map((e, i) => {
                /* Pull the start year out of the period string ("Sep 2021 — Present" → "2021"). */
                const yearMatch = (e.period || '').match(/(20\d{2})/);
                const year = yearMatch ? yearMatch[1] : '—';
                return (
                  <article key={e.id || i} className={`exp-ledger-row reveal delay-${(i % 4) + 1}`}>
                    <div className="elr-year">
                      <span className="elr-year-num">{year}</span>
                      <span className="elr-year-tag">{String(i + 1).padStart(2, '0')} / Chapter</span>
                    </div>
                    <div className="elr-rule" />
                    <div className="elr-body">
                      <div className="elr-headline">
                        <h3 className="elr-role">{e.role}</h3>
                        <span className="elr-arrow">↗</span>
                      </div>
                      <div className="elr-org">@ {e.org}</div>
                      <div className="elr-period">{e.period}</div>
                    </div>
                    <div className="elr-meta">
                      {e.type && <span className="elr-tag">{e.type}</span>}
                      {e.duration && <span className="elr-tag muted">{e.duration}</span>}
                      {e.location && <span className="elr-loc">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {e.location}
                      </span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* EDUCATION — single highlighted card */}
      <section className="edu" id="education">
        <div className="container">
          <div className="edu-head reveal">
            <span className="section-tag">05 / Education</span>
            <h2 className="huge-h">Where the<br/>foundations <em>were laid.</em></h2>
          </div>
          <div className="edu-card reveal">
            <div className="edu-side">
              <div className="edu-period">2022 → 2026</div>
              <div className="edu-degree">B.E.</div>
            </div>
            <div className="edu-main">
              <span className="edu-tag">Bachelor of Engineering</span>
              <h3>NMAM Institute of Technology</h3>
              <div className="edu-branch">Computer Science &amp; Engineering</div>
              <div className="edu-meta">
                <span>Aug 2022 — May 2026</span>
                <span>· Karnataka, India</span>
              </div>
            </div>
            <div className="edu-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS — bento asymmetric grid */}
      <section className="products" id="products">
        <div className="container">
          <div className="prod-head reveal">
            <span className="section-tag">06 / Products</span>
            <h2 className="huge-h">Ventures<br/>&amp; <em>builds.</em></h2>
            <p className="lead-text" style={{ marginTop: 16 }}>
              Every product begins with a problem worth solving. These are the ones being built, shipped and backed.
            </p>
          </div>
          <div className="bento-grid">
            {productsRender.map((p, i) => (
              <div key={p.id || i} className={`reveal delay-${(i % 4) + 1}`}>
                <ProductCard product={p} size={bentoSize(i)} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY — horizontal scroll rail */}
      <section className="gal-strip">
        <div className="container">
          <div className="gal-head reveal">
            <span className="section-tag">07 / Gallery</span>
            <h2 className="huge-h">Moments &amp; <em>milestones.</em></h2>
            <p className="lead-text" style={{ marginTop: 16 }}>
              Tap any frame to explore the full collection.
            </p>
          </div>
        </div>
        <div className="reveal">
          <GalleryStrip items={gallery} />
        </div>
      </section>

      {/* CONTACT — split aside + morphing form */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-head reveal">
            <span className="section-tag">08 / Contact</span>
            <h2 className="huge-h">Let's<br/><em>build something.</em></h2>
          </div>
          <ContactBlock
            businessEmail={content.email1 || 'rohan.t.kini@gmail.com'}
            personalEmail={content.email2 || 'Rohankini.rk18@gmail.com'}
            phone={content.phone || '+91 63615 29586'}
            whatsapp={whatsapp} />

          <div className="social-row reveal">
            {socials.filter(s => s.href && s.name).map((s, i) => (
              <a key={s.id || s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                 className="social-pill" title={s.name}>
                <span className="sp-icon"><SocialIcon id={s.id} name={s.name} /></span>
                <span className="sp-name">{s.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA badge */}
      <section className="cta-badge-wrap">
        <div className="cta-badge">
          <div className="cta-bn">09 / Action</div>
          <h2>Ready to talk ideas,<br/><em>builds, or anything in between?</em></h2>
          <Link to="/schedule" className="btn btn-light">
            Book a One-on-One
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </section>

      {/* FOOTER — big letterform */}
      <footer className="footer">
        <div className="footer-mark">RK</div>
        <div className="footer-cols">
          <div>
            <h4>Reach</h4>
            <a href={`mailto:${content.email1}`}>{content.email1}</a>
            <a href={`mailto:${content.email2}`}>{content.email2}</a>
            <a href={`tel:${(content.phone || '').replace(/\s+/g, '')}`}>{content.phone}</a>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="#about" onClick={(e) => smoothScroll(e, 'about')}>About</a>
            <a href="#education" onClick={(e) => smoothScroll(e, 'education')}>Education</a>
            <a href="#products" onClick={(e) => smoothScroll(e, 'products')}>Products</a>
            <Link to="/gallery">Gallery</Link>
            <Link to="/schedule">Book a slot</Link>
          </div>
          <div>
            <h4>Based in</h4>
            <p>{content.address}</p>
          </div>
        </div>
        <div className="footer-rule" />
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Rohan Kini · All rights reserved.</span>
          <span>Designed and Developed by T Rohan Kini</span>
        </div>
      </footer>
    </div>
  );
}
