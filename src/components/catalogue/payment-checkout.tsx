"use client";

import Script from "next/script";
import { useState } from "react";
import { EnquiryLink } from "@/components/site/enquiry-link";
import { Button } from "@/components/ui/button";
import { formatQuantity, validateQuantity } from "@/lib/quantity";
import { TestPriceConverter } from "@/components/catalogue/test-price-converter";

type CheckoutOrder = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  productName: string;
};

type RazorpayResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (result: RazorpayResult) => void;
  modal: { ondismiss: () => void };
  theme: { color: string };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export function PaymentCheckout({
  productSlug,
  productName,
  enabled,
  isTestData = false,
  testDirectCheckoutAllowed = false,
  pricePerKgMinor,
  priceCurrency,
}: {
  productSlug: string;
  productName: string;
  enabled: boolean;
  isTestData?: boolean;
  testDirectCheckoutAllowed?: boolean;
  pricePerKgMinor?: number;
  priceCurrency?: string;
}) {
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const result = validateQuantity(quantity, unit);
  const eligible = result.valid && result.kilograms < 300;
  const bulk = result.valid && result.kilograms >= 300;
  const testPresetsKg = [25, 100, 299, 300, 500, 1_000, 5_000];

  async function beginCheckout() {
    if (!eligible || !result.valid || !scriptReady || !window.Razorpay || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/payments/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, quantity, unit }),
      });
      if (!response.ok) throw new Error("checkout-unavailable");
      const order = (await response.json()) as CheckoutOrder;
      if (
        order.productName !== productName ||
        !Number.isSafeInteger(order.amount) ||
        order.amount <= 0 ||
        !/^order_[A-Za-z0-9]+$/.test(order.orderId) ||
        !/^rzp_test_[A-Za-z0-9]+$/.test(order.keyId)
      ) {
        throw new Error("checkout-unavailable");
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SRI MAHADEVA & CO",
        description: order.productName,
        order_id: order.orderId,
        theme: { color: "#1B5E20" },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setStatus(
              "Checkout closed. No payment is confirmed by this website until the provider verifies it.",
            );
          },
        },
        handler: async (paymentResult) => {
          if (paymentResult.razorpay_order_id !== order.orderId) {
            setStatus(
              "We could not verify this payment result. Please contact the business before retrying.",
            );
            setBusy(false);
            return;
          }
          try {
            const verification = await fetch("/api/payments/verify", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paymentResult),
            });
            const resultBody = (await verification.json()) as { verified?: boolean };
            setStatus(
              verification.ok && resultBody.verified
                ? "Razorpay verified the captured payment. The business will confirm fulfillment separately."
                : "Payment is not yet confirmed as captured. Please contact the business before retrying.",
            );
          } catch {
            setStatus(
              "We could not confirm the payment result yet. Please contact the business before retrying.",
            );
          } finally {
            setBusy(false);
          }
        },
      });
      checkout.open();
    } catch {
      setBusy(false);
      setStatus("Online checkout is temporarily unavailable. You can request a quotation instead.");
    }
  }

  if (isTestData && priceCurrency === "INR" && pricePerKgMinor) {
    const testRupeesPerKg = pricePerKgMinor / 100;
    const requestQuote = (
      <EnquiryLink
        context={{
          type: bulk ? "bulk" : "product",
          productSlug,
          quantity: result.valid ? String(result.entered) : undefined,
          unit: result.valid ? result.unit : undefined,
        }}
        variant="secondary"
      >
        Request a quotation
      </EnquiryLink>
    );

    return (
      <section aria-labelledby="secure-checkout-heading" className="payment-checkout" data-reveal>
        {enabled ? (
          <Script
            onError={() => setStatus("Secure checkout could not load. Please request a quotation.")}
            onLoad={() => setScriptReady(true)}
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="afterInteractive"
          />
        ) : null}
        <h2 id="secure-checkout-heading">Test checkout</h2>
        <p>
          Development fixture only. These products and prices are for testing and are not business
          offers. Payments use Razorpay test mode only.
        </p>
        <TestPriceConverter
          kilograms={result.valid ? result.kilograms : 0}
          pricePerKgRupees={testRupeesPerKg}
        />
        <fieldset className="test-quantity-presets">
          <legend>Test quantities · kg</legend>
          <div className="test-quantity-presets__list">
            {testPresetsKg.map((preset) => (
              <Button
                key={preset}
                onClick={() => {
                  setQuantity(String(preset));
                  setUnit("kg");
                }}
                type="button"
                variant="secondary"
              >
                {preset.toLocaleString("en-IN")} kg
              </Button>
            ))}
          </div>
        </fieldset>
        <div className="quantity-enquiry__fields">
          <div className="form-field">
            <label htmlFor="payment-quantity">Quantity</label>
            <input
              autoComplete="off"
              className="form-control"
              id="payment-quantity"
              inputMode="decimal"
              maxLength={16}
              onChange={(event) => setQuantity(event.currentTarget.value)}
              type="text"
              value={quantity}
            />
          </div>
          <div className="form-field">
            <label htmlFor="payment-unit">Unit</label>
            <select
              className="form-control"
              id="payment-unit"
              onChange={(event) => setUnit(event.currentTarget.value)}
              value={unit}
            >
              <option value="kg">kg</option>
              <option value="quintal">quintal</option>
              <option value="metric ton">metric ton</option>
            </select>
          </div>
        </div>
        {result.valid ? (
          <p aria-live="polite" className="quantity-enquiry__equivalent">
            Equivalent: {formatQuantity(result.kilograms)} kg
          </p>
        ) : quantity ? (
          <p className="form-field__error" role="alert">
            {result.error}
          </p>
        ) : null}
        {bulk ? (
          <p className="payment-checkout__bulk-note">
            300 kg or more must use the quotation flow. No direct checkout is available for this
            quantity.
          </p>
        ) : null}
        {testDirectCheckoutAllowed && !bulk ? (
          <Button
            disabled={!eligible || !enabled || !scriptReady || busy}
            onClick={beginCheckout}
            type="button"
          >
            {busy
              ? "Preparing Razorpay test checkout…"
              : enabled
                ? "Pay securely · test mode"
                : "Test checkout not configured"}
          </Button>
        ) : (
          <p className="payment-checkout__bulk-note">
            This test fixture is configured for enquiries only; it cannot enter direct checkout.
          </p>
        )}
        {requestQuote}
        {status ? (
          <p aria-live="polite" role="status">
            {status}
          </p>
        ) : null}
        <p className="form-field__hint">
          Test quantities under 300 kg can use the test checkout only when test credentials and a
          development database are configured. The server independently checks the 300 kg limit and
          computes the INR amount. 1 quintal = 100 kg · 1 metric ton = 1,000 kg.
        </p>
      </section>
    );
  }

  if (!enabled) {
    return (
      <section aria-labelledby="secure-checkout-heading" className="payment-checkout" data-reveal>
        <h2 id="secure-checkout-heading">Online checkout</h2>
        <p>
          Online payment is disabled for this sample listing. The business must verify the product,
          price, currency and sale terms before checkout can be enabled.
        </p>
        <Button disabled type="button">
          Pay securely · not enabled
        </Button>
        <EnquiryLink context={{ type: "product", productSlug }} variant="secondary">
          Request a quotation
        </EnquiryLink>
      </section>
    );
  }

  return (
    <section aria-labelledby="secure-checkout-heading" className="payment-checkout">
      <Script
        onError={() => setStatus("Secure checkout could not load. Please request a quotation.")}
        onLoad={() => setScriptReady(true)}
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <h2 id="secure-checkout-heading">Online checkout</h2>
      <p>
        Direct checkout is limited to quantities below 300 kg. Larger requirements need a quotation.
        Payment and fulfillment are separate: fulfillment is not confirmed by opening checkout.
      </p>
      <div className="quantity-enquiry__fields">
        <div className="form-field">
          <label htmlFor="payment-quantity">Quantity</label>
          <input
            autoComplete="off"
            className="form-control"
            id="payment-quantity"
            inputMode="decimal"
            maxLength={16}
            onChange={(event) => setQuantity(event.currentTarget.value)}
            type="text"
            value={quantity}
          />
        </div>
        <div className="form-field">
          <label htmlFor="payment-unit">Unit</label>
          <select
            className="form-control"
            id="payment-unit"
            onChange={(event) => setUnit(event.currentTarget.value)}
            value={unit}
          >
            <option value="kg">kg</option>
            <option value="quintal">quintal</option>
            <option value="metric ton">metric ton</option>
          </select>
        </div>
      </div>
      {result.valid ? (
        <p aria-live="polite" className="quantity-enquiry__equivalent">
          Equivalent: {formatQuantity(result.kilograms)} kg
        </p>
      ) : quantity ? (
        <p className="form-field__error" role="alert">
          {result.error}
        </p>
      ) : null}
      {bulk ? (
        <EnquiryLink
          context={{
            type: "bulk",
            productSlug,
            quantity: String(result.entered),
            unit: result.unit,
          }}
          variant="primary"
        >
          Request a quotation
        </EnquiryLink>
      ) : (
        <Button disabled={!eligible || !scriptReady || busy} onClick={beginCheckout} type="button">
          {busy ? "Preparing secure checkout…" : "Pay securely"}
        </Button>
      )}
      {!eligible ? (
        <EnquiryLink
          context={{
            type: bulk ? "bulk" : "product",
            productSlug,
            quantity: result.valid ? String(result.entered) : undefined,
            unit: result.valid ? result.unit : undefined,
          }}
          variant="secondary"
        >
          Request a quotation
        </EnquiryLink>
      ) : null}
      {status ? (
        <p aria-live="polite" role="status">
          {status}
        </p>
      ) : null}
      <p className="form-field__hint">
        Card details are handled by Razorpay Checkout and are not stored by this website. Do not
        retry while a payment status is uncertain; contact the business first.
      </p>
    </section>
  );
}
