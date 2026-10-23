import type { AnchorHTMLAttributes, ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import type { EnquiryContext } from "@/lib/enquiry-context";
import { buildContactHref } from "@/lib/enquiry-context";

type EnquiryLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  appearance?: "button" | "text";
  children: ReactNode;
  context?: Partial<EnquiryContext>;
  size?: "default" | "small";
  variant?: "primary" | "secondary" | "light";
};

export function EnquiryLink({
  appearance = "button",
  className,
  context,
  children,
  size,
  variant,
  ...props
}: EnquiryLinkProps) {
  const href = buildContactHref(context);

  if (appearance === "text") {
    return (
      <a className={className ?? "text-link"} href={href} {...props}>
        {children} <span aria-hidden="true">→</span>
      </a>
    );
  }

  return (
    <ButtonLink className={className} href={href} size={size} variant={variant} {...props}>
      {children}{" "}
      <span aria-hidden="true" className="button__arrow">
        →
      </span>
    </ButtonLink>
  );
}
