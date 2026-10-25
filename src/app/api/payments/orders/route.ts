import { randomUUID } from "node:crypto";
import { z } from "zod";
import { quantityUnits } from "@/lib/quantity";
import { getCheckoutPrice } from "@/server/payment-pricing";
import {
  calculateAmountMinor,
  isEligibleForDirectCheckout,
  parsePaymentQuantity,
} from "@/server/payment-policy";
import { readServerPaymentEnv } from "@/server/payment-env";
import {
  paymentError,
  paymentSuccess,
  readJsonBody,
  requestHasAllowedOrigin,
} from "@/server/payment-http";
import { getPrismaClient } from "@/server/prisma";
import { consumeOrderRateLimit } from "@/server/payment-rate-limit";
import { createRazorpayClient } from "@/server/razorpay";
import { getCheckoutProductBySlug } from "@/server/catalogue";
import { getTestCheckoutPrice } from "@/server/payment-test-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const orderRequestSchema = z
  .object({
    productSlug: z.string().min(1).max(80),
    quantity: z.string().min(1).max(16),
    unit: z.enum(quantityUnits),
  })
  .strict();

export async function POST(request: Request): Promise<Response> {
  const config = readServerPaymentEnv();
  if (!config)
    return paymentError(503, "Online checkout is not configured. Please request a quotation.");
  if (!requestHasAllowedOrigin(request, config.APP_ORIGIN)) {
    return paymentError(403, "This payment request could not be processed.");
  }

  const body = await readJsonBody(request);
  if (!body.ok) return paymentError(body.status, "The payment request is invalid.");

  let input: z.infer<typeof orderRequestSchema>;
  try {
    input = orderRequestSchema.parse(JSON.parse(body.text));
  } catch {
    return paymentError(400, "The payment request is invalid.");
  }

  let product: Awaited<ReturnType<typeof getCheckoutProductBySlug>>;
  try {
    product = await getCheckoutProductBySlug(input.productSlug);
  } catch {
    return paymentError(503, "Checkout is temporarily unavailable. Please request a quotation.");
  }
  const price = getCheckoutPrice(product);
  const quantity = parsePaymentQuantity(input.quantity, input.unit);
  const isTestFixture = Boolean(product?.isTestData && getTestCheckoutPrice(input.productSlug));
  if (!product || (!isTestFixture && product.isSample) || !price || !quantity) {
    return paymentError(
      422,
      "This item is not configured for online checkout. Please request a quotation.",
    );
  }
  if (!isEligibleForDirectCheckout(quantity.milliKilograms)) {
    return paymentError(422, "Requirements of 300 kg or more must be handled as an enquiry.");
  }

  const amountPaise = calculateAmountMinor(quantity.milliKilograms, price.pricePerKgMinor);
  if (amountPaise === null) {
    return paymentError(
      422,
      "The requested quantity cannot be priced. Please request a quotation.",
    );
  }

  const rateLimit = await consumeOrderRateLimit(request, config);
  if (rateLimit === "limited")
    return paymentError(429, "Too many checkout attempts. Please wait and try again.");
  if (rateLimit === "unavailable")
    return paymentError(503, "Checkout is temporarily unavailable. Please try again later.");

  const internalOrderId = randomUUID();
  const receipt = `smc-${internalOrderId}`;
  const kilograms = Number(quantity.milliKilograms) / 1000;
  let localOrder: { id: string };
  const prisma = getPrismaClient();

  try {
    localOrder = await prisma.paymentOrder.create({
      data: {
        id: internalOrderId,
        productSlug: product.slug,
        quantityKilograms: kilograms,
        unitPricePaise: price.pricePerKgMinor,
        amountPaise,
        currency: price.currency,
        status: "CREATED",
      },
      select: { id: true },
    });
  } catch {
    return paymentError(503, "Checkout is temporarily unavailable. Please request a quotation.");
  }

  try {
    const razorpay = createRazorpayClient(config);
    const providerOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: price.currency,
      receipt,
      partial_payment: false,
      notes: { internal_order_id: localOrder.id, product_slug: product.slug },
    });
    if (
      !providerOrder.id ||
      providerOrder.amount !== amountPaise ||
      providerOrder.currency !== price.currency
    ) {
      await prisma.paymentOrder.update({
        where: { id: localOrder.id },
        data: { status: "FAILED" },
      });
      return paymentError(502, "Checkout is temporarily unavailable. Please request a quotation.");
    }

    await prisma.paymentOrder.update({
      where: { id: localOrder.id },
      data: { razorpayOrderId: providerOrder.id, status: "PENDING" },
    });
    return paymentSuccess({
      keyId: config.RAZORPAY_KEY_ID,
      orderId: providerOrder.id,
      amount: amountPaise,
      currency: price.currency,
      productName: product.displayName,
    });
  } catch {
    try {
      await prisma.paymentOrder.update({
        where: { id: localOrder.id },
        data: { status: "FAILED" },
      });
    } catch {
      // Keep provider and database errors out of public responses and logs.
    }
    return paymentError(502, "Checkout is temporarily unavailable. Please request a quotation.");
  }
}
