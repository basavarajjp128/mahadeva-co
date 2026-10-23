import type { AnchorHTMLAttributes, ReactNode } from "react";
import { getWhatsAppHref } from "@/config/contact";
import { ButtonLink } from "@/components/ui/button";
import { buildWhatsAppEnquiryMessage } from "@/lib/enquiry-message";

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
  const enquiryMessage =
    message ??
    buildWhatsAppEnquiryMessage({
      product: "General enquiry",
    });
  const whatsappHref = getWhatsAppHref(enquiryMessage);

  if (!whatsappHref) {
    return (
      <p className="contact-setup-message">
        WhatsApp is not configured yet. Add the public business number in
        <code>src/config/contact.ts</code>.
      </p>
    );
  }

  return (
    <ButtonLink
      aria-label={"Open a WhatsApp enquiry draft"}
      className={className}
      href={whatsappHref}
      rel="noopener noreferrer"
      size={size}
      target="_blank"
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
