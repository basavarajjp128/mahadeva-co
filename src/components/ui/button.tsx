import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "light";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: "default" | "small";
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: "default" | "small";
};

function buttonClassName(variant: Variant, size: "default" | "small", className?: string) {
  return ["button", `button--${variant}`, size === "small" ? "button--small" : "", className]
    .filter(Boolean)
    .join(" ");
}

export function ButtonLink({
  children,
  variant = "primary",
  size = "default",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={buttonClassName(variant, size, className)} {...props}>
      {children}
    </a>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "default",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClassName(variant, size, className)} type={type} {...props}>
      {children}
    </button>
  );
}
