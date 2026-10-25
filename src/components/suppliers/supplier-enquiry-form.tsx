"use client";

import { useId, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { getWhatsAppHref } from "@/config/contact";
import {
  buildSupplierWhatsAppMessage,
  copraGrades,
  formatSupplierQuantity,
  parseSupplierEnquiry,
  supplierQuantityUnits,
  type SupplierEnquiryDraft,
  type SupplierEnquiryErrors,
  type ValidatedSupplierEnquiry,
} from "@/lib/supplier-enquiry";
import { formatQuantity } from "@/lib/quantity";

const initialValues: SupplierEnquiryDraft = {
  fullName: "",
  mobile: "",
  quantity: "",
  unit: "kg",
  grade: "Not Sure",
  villageDistrict: "",
  notes: "",
  website: "",
};

function FieldError({ error, id }: { error?: string; id: string }) {
  return error ? (
    <span className="form-field__error" id={`${id}-error`} role="alert">
      {error}
    </span>
  ) : null;
}

export function SupplierEnquiryForm() {
  const id = useId();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<SupplierEnquiryErrors>({});
  const [review, setReview] = useState<ValidatedSupplierEnquiry | null>(null);
  const [serverValidated, setServerValidated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function update<K extends keyof SupplierEnquiryDraft>(field: K, value: SupplierEnquiryDraft[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
    setReview(null);
    setServerValidated(false);
    setStatus(null);
  }

  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseSupplierEnquiry(values);
    if (!result.success) {
      setErrors(result.errors);
      setStatus("Please correct the highlighted fields before reviewing your enquiry.");
      return;
    }
    setErrors({});
    setStatus(null);
    setReview(result.data);
    setServerValidated(false);
  }

  async function validateOnServer() {
    if (!review || isChecking) return;
    setIsChecking(true);
    setStatus(null);
    try {
      const response = await fetch("/api/supplier-enquiries/validate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        cache: "no-store",
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error.slice(0, 180)
            : "We could not validate the enquiry. Please try again or contact us on WhatsApp.";
        setStatus(message);
        return;
      }
      setServerValidated(true);
      setStatus(
        "Your details passed server checks. This website has not saved or sent your enquiry. Choose Request a Call Back to open WhatsApp, then press Send.",
      );
    } catch {
      setStatus("We could not validate the enquiry. Please try again or contact us on WhatsApp.");
    } finally {
      setIsChecking(false);
    }
  }

  const whatsappHref =
    review && serverValidated ? getWhatsAppHref(buildSupplierWhatsAppMessage(review)) : null;

  return (
    <div className="supplier-form-card">
      <div className="supplier-form-card__heading">
        <p className="eyebrow">Farmer enquiry</p>
        <h2 id={`${id}-heading`}>{review ? "Review your details" : "Tell us about your copra"}</h2>
        <p className="supplier-form-card__description">
          Share an estimate. The owner will assess quality and discuss price and pickup separately;
          this is not a confirmed sale or price offer.
        </p>
      </div>

      {!review ? (
        <form
          aria-labelledby={`${id}-heading`}
          className="supplier-form"
          noValidate
          onSubmit={handleReview}
        >
          <div className="supplier-form__honeypot" aria-hidden="true">
            <label htmlFor={`${id}-website`}>Leave this field empty</label>
            <input
              autoComplete="off"
              id={`${id}-website`}
              name="website"
              onChange={(event) => update("website", event.currentTarget.value)}
              tabIndex={-1}
              value={values.website}
            />
          </div>

          <div className="form-field-group">
            <label className="form-field" htmlFor={`${id}-name`}>
              <span className="form-field__label">Farmer’s full name *</span>
              <input
                aria-describedby={errors.fullName ? `${id}-name-error` : undefined}
                aria-invalid={Boolean(errors.fullName)}
                autoComplete="name"
                className="form-control"
                id={`${id}-name`}
                maxLength={100}
                name="fullName"
                onChange={(event) => update("fullName", event.currentTarget.value)}
                required
                type="text"
                value={values.fullName}
              />
              <FieldError error={errors.fullName} id={`${id}-name`} />
            </label>
            <label className="form-field" htmlFor={`${id}-mobile`}>
              <span className="form-field__label">Mobile number *</span>
              <input
                aria-describedby={errors.mobile ? `${id}-mobile-error` : `${id}-mobile-hint`}
                aria-invalid={Boolean(errors.mobile)}
                autoComplete="tel-national"
                className="form-control"
                id={`${id}-mobile`}
                inputMode="tel"
                maxLength={24}
                name="mobile"
                onChange={(event) => update("mobile", event.currentTarget.value)}
                required
                type="tel"
                value={values.mobile}
              />
              {errors.mobile ? (
                <FieldError error={errors.mobile} id={`${id}-mobile`} />
              ) : (
                <span className="form-field__hint" id={`${id}-mobile-hint`}>
                  Enter a 10-digit Indian mobile number; +91 is optional.
                </span>
              )}
            </label>
          </div>

          <fieldset className="supplier-form__fieldset">
            <legend>Copra quantity and grade</legend>
            <div className="form-field-group supplier-form__quantity">
              <label className="form-field" htmlFor={`${id}-quantity`}>
                <span className="form-field__label">Available quantity *</span>
                <input
                  aria-describedby={errors.quantity ? `${id}-quantity-error` : undefined}
                  aria-invalid={Boolean(errors.quantity)}
                  className="form-control"
                  id={`${id}-quantity`}
                  inputMode="decimal"
                  max="1000000"
                  min="0.001"
                  name="quantity"
                  onChange={(event) => update("quantity", event.currentTarget.value)}
                  required
                  step="0.001"
                  type="number"
                  value={values.quantity}
                />
                <FieldError error={errors.quantity} id={`${id}-quantity`} />
              </label>
              <label className="form-field" htmlFor={`${id}-unit`}>
                <span className="form-field__label">Unit *</span>
                <select
                  aria-describedby={errors.unit ? `${id}-unit-error` : undefined}
                  aria-invalid={Boolean(errors.unit)}
                  className="form-control"
                  id={`${id}-unit`}
                  name="unit"
                  onChange={(event) =>
                    update("unit", event.currentTarget.value as SupplierEnquiryDraft["unit"])
                  }
                  value={values.unit}
                >
                  {supplierQuantityUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit === "metric tonne" ? "Metric tonne" : unit}
                    </option>
                  ))}
                </select>
                <FieldError error={errors.unit} id={`${id}-unit`} />
              </label>
              <label className="form-field" htmlFor={`${id}-grade`}>
                <span className="form-field__label">Copra grade</span>
                <select
                  aria-describedby={errors.grade ? `${id}-grade-error` : undefined}
                  aria-invalid={Boolean(errors.grade)}
                  className="form-control"
                  id={`${id}-grade`}
                  name="grade"
                  onChange={(event) =>
                    update("grade", event.currentTarget.value as SupplierEnquiryDraft["grade"])
                  }
                  value={values.grade}
                >
                  {copraGrades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                <FieldError error={errors.grade} id={`${id}-grade`} />
              </label>
            </div>
          </fieldset>

          <label className="form-field" htmlFor={`${id}-location`}>
            <span className="form-field__label">Village/town and district *</span>
            <input
              aria-describedby={errors.villageDistrict ? `${id}-location-error` : undefined}
              aria-invalid={Boolean(errors.villageDistrict)}
              autoComplete="address-level2"
              className="form-control"
              id={`${id}-location`}
              maxLength={180}
              name="villageDistrict"
              onChange={(event) => update("villageDistrict", event.currentTarget.value)}
              required
              type="text"
              value={values.villageDistrict}
            />
            <FieldError error={errors.villageDistrict} id={`${id}-location`} />
          </label>

          <label className="form-field" htmlFor={`${id}-notes`}>
            <span className="form-field__label">Additional notes (optional)</span>
            <textarea
              aria-describedby={errors.notes ? `${id}-notes-error` : undefined}
              aria-invalid={Boolean(errors.notes)}
              className="form-control"
              id={`${id}-notes`}
              maxLength={1_000}
              name="notes"
              onChange={(event) => update("notes", event.currentTarget.value)}
              rows={4}
              value={values.notes ?? ""}
            />
            <FieldError error={errors.notes} id={`${id}-notes`} />
          </label>

          <p className="supplier-form__privacy">
            Privacy: your details are sent to this website only for validation and rate limiting.
            They are not saved here. If you continue to WhatsApp, your draft is addressed to SRI
            MAHADEVA &amp; CO; the owner receives it only after you press Send.
          </p>
          <Button type="submit">Review selling enquiry</Button>
          {status ? (
            <p aria-live="polite" className="supplier-form__status" role="status">
              {status}
            </p>
          ) : null}
        </form>
      ) : (
        <section aria-labelledby={`${id}-review-heading`} className="supplier-review">
          <h3 id={`${id}-review-heading`}>Check before continuing</h3>
          <dl className="supplier-review__details">
            <div>
              <dt>Farmer</dt>
              <dd>{review.fullName}</dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd>{review.mobile}</dd>
            </div>
            <div>
              <dt>Available copra</dt>
              <dd>
                {formatSupplierQuantity(review)} · {formatQuantity(review.quantityKilograms)} kg
                equivalent
              </dd>
            </div>
            <div>
              <dt>Grade</dt>
              <dd>{review.grade}</dd>
            </div>
            <div>
              <dt>Village/town and district</dt>
              <dd>{review.villageDistrict}</dd>
            </div>
            {review.notes ? (
              <div>
                <dt>Additional notes</dt>
                <dd>{review.notes}</dd>
              </div>
            ) : null}
          </dl>

          <p className="supplier-review__notice">
            This is a selling enquiry, not a confirmed sale or guaranteed price. The owner must
            assess the copra and separately agree quality, price and pickup.
          </p>

          <div className="supplier-review__actions">
            <Button
              onClick={() => {
                setReview(null);
                setServerValidated(false);
                setStatus(null);
              }}
              variant="secondary"
            >
              Edit details
            </Button>
            {serverValidated ? (
              whatsappHref ? (
                <ButtonLink href={whatsappHref} rel="noreferrer" target="_blank">
                  Request a Call Back
                </ButtonLink>
              ) : (
                <p className="supplier-form__status" role="status">
                  WhatsApp is not configured. Contact details are managed in the site configuration.
                </p>
              )
            ) : (
              <Button disabled={isChecking} onClick={validateOnServer}>
                {isChecking ? "Checking details…" : "Continue to WhatsApp"}
              </Button>
            )}
          </div>
          {status ? (
            <p aria-live="polite" className="supplier-form__status" role="status">
              {status}
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
