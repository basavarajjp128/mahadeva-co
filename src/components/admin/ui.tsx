import type { ReactNode } from "react";

export function AdminField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`admin-field${error ? " admin-field--invalid" : ""}`}>
      <label className="admin-field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="admin-field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="admin-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AdminAlert({
  variant = "info",
  children,
}: {
  variant?: "info" | "success" | "warning" | "error";
  children: ReactNode;
}) {
  return (
    <div
      className={`admin-alert admin-alert--${variant}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="admin-page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`admin-badge admin-badge--${status}`}>{label}</span>;
}

export function AdminEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="admin-empty">
      <p className="admin-empty__title">{title}</p>
      <p className="admin-empty__description">{description}</p>
    </div>
  );
}
