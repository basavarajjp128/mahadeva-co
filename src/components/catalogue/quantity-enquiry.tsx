"use client";

import { useId, useState } from "react";
import { WhatsAppEnquiryLink } from "@/components/site/whatsapp-enquiry-link";
import { getWhatsAppHref } from "@/config/contact";
import { formatQuantity, quantityUnits, validateQuantity } from "@/lib/quantity";

export function QuantityEnquiry({ productName }: { productName: string }) {
  const id = useId();
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const result = validateQuantity(quantity, unit);
  const describedBy = `${id}-hint${quantity ? ` ${id}-error` : ""}`;
  const message = result.valid
    ? `Hello, I would like a quotation for ${formatQuantity(result.entered)} ${result.unit} (${formatQuantity(result.kilograms)} kg equivalent) of ${productName}. Please share product information and applicable terms.`
    : undefined;
  const enquiryHref = getWhatsAppHref(message);

  return (
    <section aria-labelledby={`${id}-heading`} className="quantity-enquiry">
      <h2 id={`${id}-heading`}>Request a quotation</h2>
      <p className="quantity-enquiry__intro">
        Share an indicative quantity to prepare your enquiry. This sample listing does not confirm
        availability, reserve stock or place an order.
      </p>
      <div className="quantity-enquiry__fields">
        <div className="form-field">
          <label htmlFor={`${id}-quantity`}>Quantity</label>
          <input
            aria-describedby={describedBy}
            aria-invalid={Boolean(quantity) && !result.valid}
            autoComplete="off"
            id={`${id}-quantity`}
            inputMode="decimal"
            onChange={(event) => setQuantity(event.currentTarget.value)}
            placeholder="Enter quantity"
            type="text"
            value={quantity}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`${id}-unit`}>Unit</label>
          <select
            id={`${id}-unit`}
            onChange={(event) => setUnit(event.currentTarget.value)}
            value={unit}
          >
            {quantityUnits.map((quantityUnit) => (
              <option key={quantityUnit} value={quantityUnit}>
                {quantityUnit}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="form-field__hint" id={`${id}-hint`}>
        Positive quantities up to 1,000,000 kg equivalent; up to three decimal places. This is an
        input limit, not a supply or availability statement.
      </p>
      {quantity && !result.valid ? (
        <p className="form-field__error" id={`${id}-error`} role="alert">
          {result.error}
        </p>
      ) : null}
      {result.valid ? (
        <p aria-live="polite" className="quantity-enquiry__equivalent">
          Equivalent: {formatQuantity(result.kilograms)} kg ·{" "}
          {formatQuantity(result.kilograms / 100)} quintal ·{" "}
          {formatQuantity(result.kilograms / 1_000)} metric ton
        </p>
      ) : null}
      {result.valid && message && enquiryHref ? (
        <WhatsAppEnquiryLink message={message} variant="primary">
          Request quotation by WhatsApp
        </WhatsAppEnquiryLink>
      ) : result.valid ? (
        <p className="quantity-enquiry__contact-note">
          Quantity equivalent is ready. Add the verified WhatsApp contact in site configuration to
          send this enquiry; contact details are in the footer.
        </p>
      ) : (
        <p className="quantity-enquiry__contact-note">
          Enter a valid quantity to prepare your enquiry. Contact details are shown in the footer.
        </p>
      )}
    </section>
  );
}
