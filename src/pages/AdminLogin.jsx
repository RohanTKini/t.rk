import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RkLogo from '../components/RkLogo.jsx';

const CREDS = { username: 'trohankini', password: 'rk6202' };

export default function AdminLogin() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState(false);
  const [showPw, setShowPw] = useState(false);

  /* Two-stage reveal:
   *   - 0s..2s  → fullscreen cinematic video, form hidden
   *   - 2s+     → backdrop darkens, glass form pops up smoothly */
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('rk_admin_auth') === 'true') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    const t = setTimeout(() => setRevealed(true), 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  /* Some mobile browsers block autoplay if the video isn't muted before
   * play; nudge it explicitly once the element mounts. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
  }, []);

  function submit(e) {
    e?.preventDefault?.();
    if (u.trim() === CREDS.username && p === CREDS.password) {
      sessionStorage.setItem('rk_admin_auth', 'true');
      navigate('/admin/dashboard');
    } else {
      setErr(true); setP('');
    }
  }

  return (
    <div className={`login-shell login-cinematic ${revealed ? 'is-revealed' : ''}`}>
      <video
        ref={videoRef}
        className="login-bg-video"
        src="/admin-bg.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
      />
      <div className="login-bg-tint" aria-hidden="true" />

      <form className="login-card glass" onSubmit={submit}>
        <div className="login-top">
          <div className="login-avatar"><RkLogo size={56} /></div>
          <div className="login-title">Admin Access</div>
          <div className="login-sub">Rohan Kini · Dashboard</div>
        </div>

        <div className="login-form">
          {err && <div className="error-msg">Incorrect username or password. Please try again.</div>}

          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" placeholder="Enter username" autoComplete="username"
              value={u} onChange={e => setU(e.target.value)} />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="password" type={showPw ? 'text' : 'password'} placeholder="Enter password" autoComplete="current-password"
                value={p} onChange={e => setP(e.target.value)} />
              <button type="button" onClick={() => setShowPw(s => !s)} className="pw-toggle"
                title="Show/hide password" aria-label="Toggle password visibility">
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Sign In to Dashboard
          </button>
        </div>

        <Link to="/" className="back-link">← Back to portfolio</Link>
      </form>
    </div>
  );
}
