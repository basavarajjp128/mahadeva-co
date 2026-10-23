"use client";

import { useId, useState } from "react";
import { EnquiryLink } from "@/components/site/enquiry-link";
import { formatQuantity, quantityUnits, validateQuantity } from "@/lib/quantity";

export function QuantityEnquiry({ productSlug }: { productSlug: string }) {
  const id = useId();
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const result = validateQuantity(quantity, unit);
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
            aria-describedby={`${id}-hint${quantity && !result.valid ? ` ${id}-error` : ""}`}
            aria-invalid={Boolean(quantity) && !result.valid}
            autoComplete="off"
            className="form-control"
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
            className="form-control"
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
      <div className="form-field">
        <label className="form-field__label" htmlFor={`${id}-location`}>
          Delivery location <span className="form-field__hint">(optional)</span>
        </label>
        <input
          autoComplete="shipping address-level2"
          className="form-control"
          id={`${id}-location`}
          maxLength={120}
          onChange={(event) => setDeliveryLocation(event.currentTarget.value)}
          placeholder="City or district"
          type="text"
          value={deliveryLocation}
        />
      </div>
      <EnquiryLink
        context={{
          type: "product",
          productSlug,
          quantity: result.valid ? String(result.entered) : undefined,
          unit: result.valid ? result.unit : undefined,
          deliveryLocation,
        }}
        variant="primary"
      >
        Continue to Contact Us
      </EnquiryLink>
      <p className="quantity-enquiry__contact-note">
        {quantity && !result.valid
          ? "The quantity is invalid and will not be carried to Contact Us. Correct it to include it."
          : "Your product and valid quantity, if entered, will appear on Contact Us. Nothing is submitted until you choose a contact action."}
      </p>
    </section>
  );
}
