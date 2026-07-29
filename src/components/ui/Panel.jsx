export function Panel({ icon: Icon, title, children, className = '' }) {
  return (
    <div className={`panel ${className}`.trim()}>
      {(Icon || title) && (
        <div className="panel-title">
          {Icon && <Icon size={18} />}
          {title && <h3>{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}
