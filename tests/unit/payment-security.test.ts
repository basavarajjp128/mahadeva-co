import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  calculateAmountMinor,
  isEligibleForDirectCheckout,
  parsePaymentQuantity,
} from "@/server/payment-policy";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/server/payment-signature";
import { transitionAttemptState } from "@/server/payment-state";

describe("server payment quantity and amount policy", () => {
  it("converts all supported units into exact milli-kilogram values", () => {
    expect(parsePaymentQuantity("2.5", "kg")?.milliKilograms).toBe(BigInt(2500));
    expect(parsePaymentQuantity("2.5", "quintal")?.milliKilograms).toBe(BigInt(250_000));
    expect(parsePaymentQuantity("0.25", "metric ton")?.milliKilograms).toBe(BigInt(250_000));
  });

  it.each(["25", "100", "299"])("allows test checkout at %s kg", (quantity) => {
    const value = parsePaymentQuantity(quantity, "kg");
    expect(value && isEligibleForDirectCheckout(value.milliKilograms)).toBe(true);
  });

  it.each(["300", "500", "1000", "5000"])("requires enquiry at %s kg", (quantity) => {
    const value = parsePaymentQuantity(quantity, "kg");
    expect(value && isEligibleForDirectCheckout(value.milliKilograms)).toBe(false);
  });

  it("applies the 300 kg rule after converting supported units", () => {
    const below = parsePaymentQuantity("299.999", "kg");
    const boundary = parsePaymentQuantity("3", "quintal");
    const above = parsePaymentQuantity("0.301", "metric ton");
    expect(below && isEligibleForDirectCheckout(below.milliKilograms)).toBe(true);
    expect(boundary && isEligibleForDirectCheckout(boundary.milliKilograms)).toBe(false);
    expect(above && isEligibleForDirectCheckout(above.milliKilograms)).toBe(false);
  });

  it.each(["", "0", "-1", "NaN", "Infinity", "1e3", "1.0001", "9999999999"])(
    "rejects malformed or out-of-bounds quantity %s",
    (quantity) => {
      expect(parsePaymentQuantity(quantity, "kg")).toBeNull();
    },
  );

  it("rejects unsupported units and computes a whole minor-unit amount with documented rounding", () => {
    expect(parsePaymentQuantity("1", "bag")).toBeNull();
    expect(calculateAmountMinor(BigInt(1000), 12_345)).toBe(12_345);
    expect(calculateAmountMinor(BigInt(1), 500)).toBe(1);
    expect(calculateAmountMinor(BigInt(1), 499)).toBeNull();
    expect(calculateAmountMinor(BigInt(1001), Number.MAX_SAFE_INTEGER)).toBeNull();
  });
});

describe("Razorpay signatures", () => {
  const secret = "test_only_secret_for_unit_tests_123456";

  it("accepts the documented checkout order/payment HMAC and rejects tampering", () => {
    const signature = createHmac("sha256", secret).update("order_123|pay_456").digest("hex");
    expect(
      verifyRazorpayPaymentSignature({
        orderId: "order_123",
        paymentId: "pay_456",
        signature,
        secret,
      }),
    ).toBe(true);
    expect(
      verifyRazorpayPaymentSignature({
        orderId: "order_123",
        paymentId: "pay_999",
        signature,
        secret,
      }),
    ).toBe(false);
    expect(
      verifyRazorpayPaymentSignature({
        orderId: "order_123",
        paymentId: "pay_456",
        signature: "not-a-signature",
        secret,
      }),
    ).toBe(false);
  });

  it("verifies a webhook over the exact raw body and rejects a modified body", () => {
    const rawBody = '{"event":"payment.captured","payload":{}}';
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
    expect(verifyRazorpayWebhookSignature({ rawBody, signature, secret })).toBe(true);
    expect(verifyRazorpayWebhookSignature({ rawBody: `${rawBody} `, signature, secret })).toBe(
      false,
    );
  });
});

describe("payment state transitions", () => {
  it("does not let delayed failures downgrade captured or refunded payments", () => {
    expect(transitionAttemptState("CAPTURED", "FAILED")).toBe("CAPTURED");
    expect(transitionAttemptState("REFUNDED", "CAPTURED")).toBe("REFUNDED");
    expect(transitionAttemptState("FAILED", "CAPTURED")).toBe("CAPTURED");
    expect(transitionAttemptState("CAPTURED", "PARTIALLY_REFUNDED")).toBe("PARTIALLY_REFUNDED");
  });
});
