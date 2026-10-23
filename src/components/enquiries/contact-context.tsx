"use client";

import { useEffect, useState } from "react";
import { WhatsAppEnquiryLink } from "@/components/site/whatsapp-enquiry-link";
import { getMailtoHref } from "@/config/contact";
import {
  formatEnquiryType,
  getEnquiryProduct,
  parseEnquiryContext,
  type EnquiryContext,
} from "@/lib/enquiry-context";
import { buildWhatsAppEnquiryMessage } from "@/lib/enquiry-message";
import { formatQuantity, validateQuantity } from "@/lib/quantity";

export function ContactContext() {
  const [context, setContext] = useState<EnquiryContext | null>(null);

  useEffect(() => {
    setContext(parseEnquiryContext(window.location.search));
  }, []);

  const activeContext = context ?? { type: "general" as const };
  const product = getEnquiryProduct(activeContext);
  const quantityResult = activeContext.quantity
    ? validateQuantity(activeContext.quantity, activeContext.unit ?? "")
    : null;
  const quantity = quantityResult?.valid ? formatQuantity(quantityResult.entered) : undefined;
  const message = buildWhatsAppEnquiryMessage({
    type: formatEnquiryType(activeContext.type),
    product: product?.displayName ?? "General enquiry",
    quantity,
    unit: quantityResult?.valid ? quantityResult.unit : undefined,
    deliveryLocation: activeContext.deliveryLocation,
  });
  const emailHref = getMailtoHref(message);
  const hasContext = Boolean(
    context &&
      (context.type !== "general" ||
        context.productSlug ||
        context.quantity ||
        context.deliveryLocation),
  );

  return (
    <div className="contact-context">
      {hasContext && context ? (
        <section aria-labelledby="enquiry-context-heading" className="contact-context__summary">
          <h3 id="enquiry-context-heading">Your enquiry details</h3>
          <dl>
            <div>
              <dt>Enquiry type</dt>
              <dd>{formatEnquiryType(context.type)}</dd>
            </div>
            {product ? (
              <div>
                <dt>Product</dt>
                <dd>{product.displayName}</dd>
              </div>
            ) : null}
            {quantityResult?.valid ? (
              <div>
                <dt>Quantity</dt>
                <dd>
                  {quantity} <span>({formatQuantity(quantityResult.kilograms)} kg equivalent)</span>
                </dd>
              </div>
            ) : null}
            {context.deliveryLocation ? (
              <div>
                <dt>Delivery location</dt>
                <dd>{context.deliveryLocation}</dd>
              </div>
            ) : null}
          </dl>
          {!product && context.productSlug ? (
            <p role="status">
              The selected product could not be validated; choose a product in the form.
            </p>
          ) : null}
          {context.quantity && !quantityResult?.valid ? (
            <p role="status">The supplied quantity was invalid and has not been included.</p>
          ) : null}
        </section>
      ) : null}

      <div className="contact-context__actions">
        <WhatsAppEnquiryLink message={message}>
          {hasContext ? "Continue with WhatsApp" : "Open WhatsApp enquiry"}
        </WhatsAppEnquiryLink>
        {emailHref ? (
          <a className="text-link" href={emailHref}>
            Email this enquiry
          </a>
        ) : (
          <p className="contact-setup-message" role="status">
            Business email is not configured yet. Add it in <code>src/config/contact.ts</code>.
          </p>
        )}
      </div>
      <p className="contact-context__note">
        WhatsApp opens a draft for you to review and send. Email opens your configured email
        application; neither action confirms that a message was sent.
      </p>
    </div>
  );
}
