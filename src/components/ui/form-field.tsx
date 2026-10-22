import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type SharedProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

type TextFieldProps = SharedProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaFieldProps = SharedProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

function FieldMessages({ hint, error, id }: { hint?: string; error?: string; id: string }) {
  return (
    <>
      {hint ? (
        <span className="form-field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="form-field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return (
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  className,
  ...props
}: TextFieldProps) {
  return (
    <label className="form-field" htmlFor={id}>
      <span className="form-field__label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      <input
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={["form-control", className].filter(Boolean).join(" ")}
        id={id}
        required={required}
        {...props}
      />
      <FieldMessages error={error} hint={hint} id={id} />
    </label>
  );
}

export function TextareaField({
  id,
  label,
  hint,
  error,
  required,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <label className="form-field" htmlFor={id}>
      <span className="form-field__label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      <textarea
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={["form-control", className].filter(Boolean).join(" ")}
        id={id}
        required={required}
        {...props}
      />
      <FieldMessages error={error} hint={hint} id={id} />
    </label>
  );
}

export function FormFieldGroup({ children }: { children: ReactNode }) {
  return <div className="form-field-group">{children}</div>;
}
