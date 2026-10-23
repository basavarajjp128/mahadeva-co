import { z } from "zod";
import { readServerPaymentEnv } from "@/server/payment-env";
import {
  paymentError,
  paymentSuccess,
  readJsonBody,
  requestHasAllowedOrigin,
} from "@/server/payment-http";
import { getPrismaClient } from "@/server/prisma";
import { createRazorpayClient } from "@/server/razorpay";
import { verifyRazorpayPaymentSignature } from "@/server/payment-signature";
import { transitionAttemptState, type AttemptState } from "@/server/payment-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifyRequestSchema = z
  .object({
    razorpay_order_id: z
      .string()
      .regex(/^order_[A-Za-z0-9]+$/)
      .max(64),
    razorpay_payment_id: z
      .string()
      .regex(/^pay_[A-Za-z0-9]+$/)
      .max(64),
    razorpay_signature: z.string().regex(/^[0-9a-f]{64}$/i),
  })
  .strict();

export async function POST(request: Request): Promise<Response> {
  const config = readServerPaymentEnv();
  if (!config) return paymentError(503, "Payment verification is temporarily unavailable.");
  if (!requestHasAllowedOrigin(request, config.APP_ORIGIN)) {
    return paymentError(403, "This payment result could not be verified.");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return paymentError(body.status, "This payment result could not be verified.");

  let input: z.infer<typeof verifyRequestSchema>;
  try {
    input = verifyRequestSchema.parse(JSON.parse(body.text));
  } catch {
    return paymentError(400, "This payment result could not be verified.");
  }

  if (
    !verifyRazorpayPaymentSignature({
      orderId: input.razorpay_order_id,
      paymentId: input.razorpay_payment_id,
      signature: input.razorpay_signature,
      secret: config.RAZORPAY_KEY_SECRET,
    })
  ) {
    return paymentError(400, "This payment result could not be verified.");
  }

  try {
    const prisma = getPrismaClient();
    const order = await prisma.paymentOrder.findUnique({
      where: { razorpayOrderId: input.razorpay_order_id },
      select: { id: true, amountPaise: true, currency: true, status: true },
    });
    if (!order) return paymentError(400, "This payment result could not be verified.");

    const providerPayment = await createRazorpayClient(config).payments.fetch(
      input.razorpay_payment_id,
    );
    const providerAmount = Number(providerPayment.amount);
    if (
      providerPayment.order_id !== input.razorpay_order_id ||
      !Number.isSafeInteger(providerAmount) ||
      providerAmount !== order.amountPaise ||
      providerPayment.currency !== order.currency ||
      providerPayment.status !== "captured" ||
      providerPayment.captured !== true
    ) {
      return paymentSuccess({
        verified: false,
        message: "Payment is not yet confirmed as captured.",
      });
    }

    await prisma.$transaction(async (tx) => {
      const current = await tx.paymentAttempt.findUnique({
        where: { razorpayPaymentId: providerPayment.id },
        select: { orderId: true, status: true, amountRefundedPaise: true },
      });
      if (current && current.orderId !== order.id) throw new Error("Payment order mismatch");
      const incomingState: AttemptState =
        providerPayment.refund_status === "partial" ? "PARTIALLY_REFUNDED" : "CAPTURED";
      const status = transitionAttemptState(current?.status, incomingState);
      await tx.paymentAttempt.upsert({
        where: { razorpayPaymentId: providerPayment.id },
        create: {
          orderId: order.id,
          razorpayPaymentId: providerPayment.id,
          amountPaise: providerAmount,
          amountRefundedPaise: providerPayment.amount_refunded ?? 0,
          currency: providerPayment.currency,
          status,
        },
        update: {
          status,
          amountRefundedPaise: Math.max(
            current?.amountRefundedPaise ?? 0,
            providerPayment.amount_refunded ?? 0,
          ),
        },
      });
      if (order.status !== "REFUNDED" && status !== "REFUNDED") {
        await tx.paymentOrder.update({
          where: { id: order.id },
          data: { status: "CAPTURED" },
        });
      }
    });
    return paymentSuccess({ verified: true, message: "Payment verified with Razorpay." });
  } catch {
    return paymentError(
      503,
      "Payment verification is temporarily unavailable. Please contact the business before retrying.",
    );
  }
}
