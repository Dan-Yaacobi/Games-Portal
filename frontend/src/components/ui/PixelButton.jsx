export default function PixelButton({ children, className = '', variant = 'primary', ...props }) {
  return (
    <button className={`pixel-btn pixel-btn--${variant} ${className}`.trim()} {...props}>
      <span>{children}</span>
    </button>
  );
}
