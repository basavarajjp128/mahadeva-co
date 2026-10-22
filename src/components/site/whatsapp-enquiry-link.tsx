import type { AnchorHTMLAttributes, ReactNode } from "react";
import { getWhatsAppHref } from "@/config/contact";
import { ButtonLink } from "@/components/ui/button";

type WhatsAppEnquiryLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  size?: "default" | "small";
  variant?: "primary" | "secondary" | "light";
  message?: string;
  children?: ReactNode;
};

export function WhatsAppEnquiryLink({
  className,
  size = "default",
  variant = "primary",
  message,
  children,
  ...props
}: WhatsAppEnquiryLinkProps) {
  const whatsappHref = getWhatsAppHref(message);

  return (
    <ButtonLink
      aria-label={
        whatsappHref
          ? "Start an enquiry on WhatsApp"
          : "WhatsApp enquiry contact placeholder; see the footer for details"
      }
      className={className}
      href={whatsappHref ?? "/#contact-details"}
      size={size}
      variant={variant}
      {...props}
    >
      {children ?? "WhatsApp enquiry"}{" "}
      <span aria-hidden="true" className="button__arrow">
        ↗
      </span>
    </ButtonLink>
  );
}
