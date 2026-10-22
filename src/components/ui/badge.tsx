import type { HTMLAttributes, ReactNode } from "react";

export function Badge({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span className={["badge", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </span>
  );
}
