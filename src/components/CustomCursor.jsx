import { useEffect, useRef, useState } from 'react';

/* Custom cursor with two parts:
 *   .cursor-dot   — small filled dot that snaps to the pointer instantly
 *   .cursor-ring  — larger outline that lags behind for a smooth trailing
 *                   feel; expands on interactive elements
 *
 * Only mounts on devices with a fine pointer (mouse / trackpad). Touch
 * devices and phones get the OS default. */
export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef  = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(pointer: fine)');
    if (!mql.matches) return;
    setEnabled(true);

    let mx = -100, my = -100;     // current mouse
    let rx = -100, ry = -100;     // ring (lagged) position
    let raf = 0;
    let visible = false;

    function show() {
      if (visible) return;
      visible = true;
      if (ringRef.current) ringRef.current.style.opacity = '1';
      if (dotRef.current)  dotRef.current.style.opacity  = '1';
    }
    function hide() {
      visible = false;
      if (ringRef.current) ringRef.current.style.opacity = '0';
      if (dotRef.current)  dotRef.current.style.opacity  = '0';
    }

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      show();
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      }
    }

    function onOver(e) {
      const t = e.target;
      if (!ringRef.current || !t || !t.closest) return;
      const interactive = t.closest('a, button, input, textarea, select, label, [role="button"], [data-cursor-hover]');
      ringRef.current.classList.toggle('is-hover', !!interactive);
    }

    function onDown() { ringRef.current?.classList.add('is-down'); }
    function onUp()   { ringRef.current?.classList.remove('is-down'); }

    function tick() {
      /* Ease the ring toward the mouse — feels smoother than tracking 1:1. */
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('mouseenter', show);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
    </>
  );
}
