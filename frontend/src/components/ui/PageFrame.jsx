export default function PageFrame({ title, subtitle, children, className = '' }) {
  return (
    <div className={`page-shell fade-in ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="page-header">
          {title && <h1>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}
      {children}
    </div>
  );
}
