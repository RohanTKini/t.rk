import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

/* In-app confirmation dialog — a themed replacement for window.confirm().
 *
 * Usage:
 *   const { confirm, confirmEl } = useConfirm();
 *   ...
 *   async function remove() {
 *     const ok = await confirm({ title: '…', message: '…' });
 *     if (!ok) return;
 *     // proceed
 *   }
 *   return (<>{confirmEl}  …rest of page… </>);
 */
export function useConfirm() {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((opts) => {
    const o = typeof opts === 'string' ? { message: opts } : (opts || {});
    return new Promise((resolve) => {
      setDialog({
        title: o.title || 'Please confirm',
        message: o.message || 'Are you sure you want to continue?',
        confirmText: o.confirmText || 'Confirm',
        cancelText: o.cancelText || 'Cancel',
        danger: o.danger !== false, // defaults to destructive styling
        resolve
      });
    });
  }, []);

  const close = useCallback((val) => {
    setDialog((d) => { d?.resolve(val); return null; });
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  const confirmEl = dialog
    ? createPortal(
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label={dialog.title}>
          <div className="confirm-bg" onClick={() => close(false)} />
          <div className="confirm-card">
            <div className={`confirm-mark ${dialog.danger ? 'danger' : ''}`}>
              {dialog.danger ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <h3>{dialog.title}</h3>
            <p>{dialog.message}</p>
            <div className="confirm-actions">
              <button type="button" className="confirm-btn confirm-btn-cancel" onClick={() => close(false)}>
                {dialog.cancelText}
              </button>
              <button
                type="button"
                className={`confirm-btn ${dialog.danger ? 'confirm-btn-danger' : 'confirm-btn-go'}`}
                onClick={() => close(true)}
                autoFocus
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return { confirm, confirmEl };
}
