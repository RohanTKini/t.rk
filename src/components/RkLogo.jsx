/* Reusable RK monogram. Used in nav, admin sidebar, schedule header,
 * and as the placeholder when a product card has no image yet. */
export default function RkLogo({ size = 32, square = true }) {
  const radius = square ? Math.round(size * 0.22) : size / 2;
  const fontSize = Math.round(size * 0.42);
  return (
    <span
      className="rk-logo"
      style={{
        width: size, height: size, borderRadius: radius, fontSize
      }}
      aria-label="RK"
    >
      RK
    </span>
  );
}
