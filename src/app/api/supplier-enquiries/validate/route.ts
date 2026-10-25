import { z } from "zod";
import { parseSupplierEnquiry } from "@/lib/supplier-enquiry";
import {
  paymentError,
  paymentSuccess,
  readJsonBody,
  requestHasAllowedOrigin,
} from "@/server/payment-http";
import { consumeSupplierEnquiryRateLimit } from "@/server/supplier-enquiry-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const expectedOriginSchema = z.string().url();

export async function POST(request: Request): Promise<Response> {
  const appOrigin = process.env.APP_ORIGIN;
  const requestUrl = new URL(request.url);
  const host = request.headers.get("host");
  const developmentOrigin = host
    ? new URL(`${requestUrl.protocol}//${host}`).origin
    : requestUrl.origin;
  const expectedOrigin =
    appOrigin || (process.env.NODE_ENV === "production" ? null : developmentOrigin);
  if (!expectedOrigin || !expectedOriginSchema.safeParse(expectedOrigin).success) {
    return paymentError(503, "Selling enquiries are temporarily unavailable. Please use WhatsApp.");
  }
  if (!requestHasAllowedOrigin(request, expectedOrigin)) {
    return paymentError(403, "This enquiry could not be processed.");
  }

  const rateLimit = await consumeSupplierEnquiryRateLimit(request);
  if (rateLimit === "limited") {
    return paymentError(429, "Too many requests. Please wait a little before trying again.");
  }
  if (rateLimit === "unavailable") {
    return paymentError(503, "Selling enquiries are temporarily unavailable. Please use WhatsApp.");
  }

  const body = await readJsonBody(request);
  if (!body.ok) return paymentError(body.status, "Check your enquiry details and try again.");

  let input: unknown;
  try {
    input = JSON.parse(body.text);
  } catch {
    return paymentError(400, "Check your enquiry details and try again.");
  }

  const result = parseSupplierEnquiry(input);
  if (!result.success) {
    return Response.json(
      { error: "Check the highlighted enquiry details.", fieldErrors: result.errors },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  return paymentSuccess({ valid: true });
}
