import { createHmac, timingSafeEqual } from "node:crypto";

function equalHexDigest(expected: Buffer, suppliedHex: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(suppliedHex)) return false;
  const supplied = Buffer.from(suppliedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

/** Razorpay's documented HMAC-SHA256 order_id|payment_id verification procedure. */
export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!input.orderId || !input.paymentId || !input.secret) return false;
  const expected = createHmac("sha256", input.secret)
    .update(`${input.orderId}|${input.paymentId}`, "utf8")
    .digest();
  return equalHexDigest(expected, input.signature);
}

/** Verify the provider webhook against the exact, unparsed request body. */
export function verifyRazorpayWebhookSignature(input: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  if (!input.secret) return false;
  const expected = createHmac("sha256", input.secret).update(input.rawBody, "utf8").digest();
  return equalHexDigest(expected, input.signature);
}
