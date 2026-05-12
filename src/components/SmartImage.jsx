import { useState, useEffect } from 'react';
import RkLogo from './RkLogo.jsx';

/* Wraps <img> with an automatic RK-logo fallback for two cases:
 *   1. `src` is empty / missing
 *   2. The browser fails to load the image (404, CORS, dead URL, etc.)
 *
 * The fallback fills the same box the <img> would have occupied (it inherits
 * className + style), so existing layouts keep their dimensions instead of
 * collapsing. The RkLogo is centred inside on a soft gradient background. */
export default function SmartImage({
  src,
  alt = '',
  fallbackSize = 56,
  className,
  style,
  onError,
  ...rest
}) {
  const [failed, setFailed] = useState(false);

  /* Reset error state if the src changes (e.g. user uploads a new file in
   * the admin form preview). */
  useEffect(() => { setFailed(false); }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`img-fallback ${className || ''}`}
        style={style}
        role="img"
        aria-label={alt || 'RK'}
      >
        <RkLogo size={fallbackSize} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => { setFailed(true); onError?.(e); }}
      {...rest}
    />
  );
}
