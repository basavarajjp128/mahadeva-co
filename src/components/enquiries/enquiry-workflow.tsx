"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { contactDetails, getMailtoHref, getWhatsAppHref } from "@/config/contact";
import { products as defaultProducts, type Product } from "@/data/products";
import { formatEnquiryType, getEnquiryProduct, parseEnquiryContext } from "@/lib/enquiry-context";
import { buildWhatsAppEnquiryMessage } from "@/lib/enquiry-message";
import type { EnquiryErrors, EnquiryMode, EnquiryValues } from "@/lib/enquiry-validation";
import { validateEnquiry } from "@/lib/enquiry-validation";
import { formatQuantity, validateQuantity } from "@/lib/quantity";

const initialValues: EnquiryValues = {
  name: "",
  phone: "",
  email: "",
  message: "",
  productSlug: "",
  quantity: "",
  unit: "kg",
  deliveryLocation: "",
};

type EnquiryWorkflowProps = { mode: EnquiryMode; products?: Product[] };

function FieldError({ error, id }: { error?: string; id: string }) {
  return error ? (
    <span className="form-field__error" id={`${id}-error`} role="alert">
      {error}
    </span>
  ) : null;
}

export function EnquiryWorkflow({ mode, products = defaultProducts }: EnquiryWorkflowProps) {
  const id = useId();
  const isBulk = mode === "bulk";
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (mode !== "contact") return;
    const context = parseEnquiryContext(window.location.search, products);
    const product = getEnquiryProduct(context, products);
    setValues((current) => ({
      ...current,
      productSlug: product?.slug ?? "",
      quantity: context.quantity ?? "",
      unit: context.unit ?? "kg",
      deliveryLocation: context.deliveryLocation ?? "",
    }));
  }, [mode, products]);

  function update<K extends keyof EnquiryValues>(field: K, value: EnquiryValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
    setLaunchStatus(null);
    setAttempted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    const validationErrors = validateEnquiry(values, mode, products);
    setErrors(validationErrors);
    setLaunchStatus(null);
    if (Object.keys(validationErrors).length > 0) return;

    const selectedProduct = products.find((product) => product.slug === values.productSlug);
    const enquiryContext = parseEnquiryContext(window.location.search, products);
    const quantityResult = values.quantity.trim()
      ? validateQuantity(values.quantity, values.unit)
      : null;
    const message = buildWhatsAppEnquiryMessage({
      type: formatEnquiryType(enquiryContext.type),
      product: selectedProduct?.displayName ?? "General enquiry",
      quantity: quantityResult?.valid ? formatQuantity(quantityResult.entered) : undefined,
      unit: quantityResult?.valid ? quantityResult.unit : undefined,
      deliveryLocation: values.deliveryLocation,
      name: values.name,
      message: values.message,
    });
    const whatsappHref = getWhatsAppHref(message);

    if (!whatsappHref) {
      setLaunchStatus("WhatsApp is not configured yet. Please contact the business directly.");
      return;
    }

    window.open(whatsappHref, "_blank", "noopener,noreferrer");
    setLaunchStatus(
      "If WhatsApp opens, review your enquiry and press Send there. This website has not sent or saved it.",
    );
  }

  const fieldError = (field: keyof EnquiryValues) => (attempted ? errors[field] : undefined);
  const productError = fieldError("productSlug");
  const quantityError = fieldError("quantity");
  const unitError = fieldError("unit");
  const businessEmailHref = getMailtoHref();
  const quantityResult = values.quantity.trim()
    ? validateQuantity(values.quantity, values.unit)
    : null;

  return (
    <div className="enquiry-workflow">
      <form className="enquiry-form" noValidate onSubmit={handleSubmit}>
        <div className="form-field-group">
          <label className="form-field" htmlFor={`${id}-name`}>
            <span className="form-field__label">Name *</span>
            <input
              aria-describedby={fieldError("name") ? `${id}-name-error` : undefined}
              aria-invalid={Boolean(fieldError("name"))}
              autoComplete="name"
              className="form-control"
              id={`${id}-name`}
              maxLength={100}
              name="name"
              onChange={(event) => update("name", event.currentTarget.value)}
              required
              type="text"
              value={values.name}
            />
            <FieldError error={fieldError("name")} id={`${id}-name`} />
          </label>
        </div>

        <fieldset className="enquiry-form__fieldset">
          <legend>Contact detail * (enter a phone number or email)</legend>
          <div className="form-field-group">
            <label className="form-field" htmlFor={`${id}-phone`}>
              <span className="form-field__label">Phone</span>
              <input
                aria-describedby={fieldError("phone") ? `${id}-phone-error` : undefined}
                aria-invalid={Boolean(fieldError("phone"))}
                autoComplete="tel"
                className="form-control"
                id={`${id}-phone`}
                inputMode="tel"
                maxLength={24}
                name="phone"
                onChange={(event) => update("phone", event.currentTarget.value)}
                type="tel"
                value={values.phone}
              />
              <FieldError error={fieldError("phone")} id={`${id}-phone`} />
            </label>
            <label className="form-field" htmlFor={`${id}-email`}>
              <span className="form-field__label">Email</span>
              <input
                aria-describedby={fieldError("email") ? `${id}-email-error` : undefined}
                aria-invalid={Boolean(fieldError("email"))}
                autoComplete="email"
                className="form-control"
                id={`${id}-email`}
                maxLength={254}
                name="email"
                onChange={(event) => update("email", event.currentTarget.value)}
                type="email"
                value={values.email}
              />
              <FieldError error={fieldError("email")} id={`${id}-email`} />
            </label>
          </div>
        </fieldset>

        <fieldset className="enquiry-form__fieldset">
          <legend>{isBulk ? "Bulk requirement" : "Product and quantity (optional)"}</legend>
          <div className="form-field-group">
            <label className="form-field" htmlFor={`${id}-product`}>
              <span className="form-field__label">Product{isBulk ? " *" : ""}</span>
              <select
                aria-describedby={productError ? `${id}-product-error` : undefined}
                aria-invalid={Boolean(productError)}
                className="form-control"
                id={`${id}-product`}
                name="product"
                onChange={(event) => update("productSlug", event.currentTarget.value)}
                required={isBulk}
                value={values.productSlug}
              >
                <option value="">{isBulk ? "Select a product" : "General enquiry"}</option>
                {products.map((product) => (
                  <option key={product.slug} value={product.slug}>
                    {product.displayName}
                    {product.isTestData
                      ? " · TEST ONLY"
                      : product.isSample
                        ? " · sample listing"
                        : ""}
                  </option>
                ))}
              </select>
              <FieldError error={productError} id={`${id}-product`} />
            </label>
            <label className="form-field" htmlFor={`${id}-quantity`}>
              <span className="form-field__label">Approximate quantity{isBulk ? " *" : ""}</span>
              <input
                aria-describedby={quantityError ? `${id}-quantity-error` : `${id}-quantity-hint`}
                aria-invalid={Boolean(quantityError)}
                autoComplete="off"
                className="form-control"
                id={`${id}-quantity`}
                inputMode="decimal"
                maxLength={16}
                name="quantity"
                onChange={(event) => update("quantity", event.currentTarget.value)}
                placeholder={isBulk ? "Enter quantity" : "Optional"}
                required={isBulk}
                type="text"
                value={values.quantity}
              />
              {quantityError ? (
                <FieldError error={quantityError} id={`${id}-quantity`} />
              ) : (
                <span className="form-field__hint" id={`${id}-quantity-hint`}>
                  Enter a positive quantity using up to three decimal places.
                </span>
              )}
            </label>
            <label className="form-field" htmlFor={`${id}-unit`}>
              <span className="form-field__label">Unit</span>
              <select
                aria-describedby={unitError ? `${id}-unit-error` : undefined}
                aria-invalid={Boolean(unitError)}
                className="form-control"
                id={`${id}-unit`}
                name="unit"
                onChange={(event) => update("unit", event.currentTarget.value)}
                value={values.unit}
              >
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="metric ton">metric ton</option>
              </select>
              <FieldError error={unitError} id={`${id}-unit`} />
            </label>
          </div>
          <p className="form-field__hint">
            1 quintal = 100 kg · 1 metric ton = 1,000 kg. Quantity is for an enquiry only; it does
            not check stock or place an order.
          </p>
          {quantityResult?.valid ? (
            <p aria-live="polite" className="quantity-enquiry__equivalent">
              Equivalent: {formatQuantity(quantityResult.kilograms)} kg ·{" "}
              {formatQuantity(quantityResult.kilograms / 100)} quintal ·{" "}
              {formatQuantity(quantityResult.kilograms / 1_000)} metric ton
            </p>
          ) : null}
        </fieldset>

        <label className="form-field" htmlFor={`${id}-location`}>
          <span className="form-field__label">Delivery location (optional)</span>
          <input
            autoComplete="shipping address-level2"
            className="form-control"
            id={`${id}-location`}
            maxLength={120}
            name="deliveryLocation"
            onChange={(event) => update("deliveryLocation", event.currentTarget.value)}
            type="text"
            value={values.deliveryLocation}
          />
          <FieldError error={fieldError("deliveryLocation")} id={`${id}-location`} />
        </label>

        <label className="form-field" htmlFor={`${id}-message`}>
          <span className="form-field__label">Message *</span>
          <textarea
            aria-describedby={fieldError("message") ? `${id}-message-error` : undefined}
            aria-invalid={Boolean(fieldError("message"))}
            className="form-control enquiry-form__message"
            id={`${id}-message`}
            maxLength={2_000}
            name="message"
            onChange={(event) => update("message", event.currentTarget.value)}
            required
            rows={5}
            value={values.message}
          />
          <span className="form-field__hint">Maximum 2,000 characters.</span>
          <FieldError error={fieldError("message")} id={`${id}-message`} />
        </label>

        {attempted && Object.keys(errors).length > 0 ? (
          <p className="form-field__error" role="alert">
            Please review the highlighted fields before preparing your enquiry.
          </p>
        ) : null}

        <div className="enquiry-form__actions">
          <Button disabled={!contactDetails.whatsappNumber} type="submit">
            Enquire Now
          </Button>
          {businessEmailHref ? (
            <a className="text-link" href={businessEmailHref}>
              Prefer email? Write to {contactDetails.email}
            </a>
          ) : (
            <p className="contact-setup-message">
              Business email is not configured yet. Add it in <code>src/config/contact.ts</code>.
            </p>
          )}
        </div>
      </form>

      {launchStatus ? (
        <p aria-live="polite" className="contact-context__note" role="status">
          {launchStatus}
        </p>
      ) : null}
      <p className="enquiry-workflow__privacy">
        This first version validates and prepares the message in your browser only. It does not
        submit to a server or retain the enquiry.
      </p>
    </div>
  );
}
