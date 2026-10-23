import { createHash } from "node:crypto";
import { z } from "zod";
import { readServerPaymentEnv } from "@/server/payment-env";
import { paymentError, paymentSuccess, readJsonBody } from "@/server/payment-http";
import { getPrismaClient } from "@/server/prisma";
import { createRazorpayClient } from "@/server/razorpay";
import { transitionAttemptState, type AttemptState } from "@/server/payment-state";
import { verifyRazorpayWebhookSignature } from "@/server/payment-signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookEnvelopeSchema = z
  .object({
    event: z.string().min(1).max(80),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const paymentEntitySchema = z.object({
  id: z
    .string()
    .regex(/^pay_[A-Za-z0-9]+$/)
    .max(64),
  order_id: z
    .string()
    .regex(/^order_[A-Za-z0-9]+$/)
    .max(64),
  amount: z.number().int().positive().safe(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(["created", "authorized", "captured", "failed", "refunded"]),
  amount_refunded: z.number().int().nonnegative().safe().optional(),
  refund_status: z.enum(["null", "partial", "full"]).optional(),
  captured: z.boolean().optional(),
});

const refundEntitySchema = z.object({
  id: z
    .string()
    .regex(/^rfnd_[A-Za-z0-9]+$/)
    .max(64),
  payment_id: z
    .string()
    .regex(/^pay_[A-Za-z0-9]+$/)
    .max(64),
  amount: z.number().int().positive().safe(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(["processed", "pending", "failed"]),
});

type VerifiedProviderPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
  amount_refunded?: number;
  refund_status?: "null" | "partial" | "full";
};

function normalizeProviderPayment(payment: {
  id: string;
  order_id: string;
  amount: number | string;
  currency: string;
  status: string;
  captured: boolean;
  amount_refunded?: number;
  refund_status?: "null" | "partial" | "full";
}): VerifiedProviderPayment | null {
  const amount = Number(payment.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  return { ...payment, amount };
}

function readEventEntity<T>(
  payload: Record<string, unknown> | undefined,
  name: string,
  schema: z.ZodType<T>,
): T | null {
  const collection = payload?.[name];
  if (!collection || typeof collection !== "object") return null;
  const entity = (collection as Record<string, unknown>).entity;
  const parsed = schema.safeParse(entity);
  return parsed.success ? parsed.data : null;
}

function isDuplicateEventError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002",
  );
}

export async function POST(request: Request): Promise<Response> {
  const config = readServerPaymentEnv();
  if (!config) return paymentError(503, "Webhook verification is not configured.");
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const eventId = request.headers.get("x-razorpay-event-id") ?? "";
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(eventId)) {
    return paymentError(400, "Invalid webhook request.");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return paymentError(body.status, "Invalid webhook request.");
  if (
    !verifyRazorpayWebhookSignature({
      rawBody: body.text,
      signature,
      secret: config.RAZORPAY_WEBHOOK_SECRET,
    })
  ) {
    return paymentError(400, "Invalid webhook signature.");
  }

  let envelope: z.infer<typeof webhookEnvelopeSchema>;
  try {
    envelope = webhookEnvelopeSchema.parse(JSON.parse(body.text));
  } catch {
    return paymentError(400, "Invalid webhook request.");
  }

  const paymentEntity = readEventEntity(envelope.payload, "payment", paymentEntitySchema);
  const refundEntity = readEventEntity(envelope.payload, "refund", refundEntitySchema);
  let verifiedPayment: VerifiedProviderPayment | null = null;
  let incomingState: AttemptState | null = null;
  let paymentOrderId: string | null = null;
  let paymentId: string | null = null;
  let amountRefundedPaise = 0;

  try {
    const prisma = getPrismaClient();
    if (["payment.captured", "payment.authorized", "payment.failed"].includes(envelope.event)) {
      if (!paymentEntity) return paymentError(400, "Invalid webhook request.");
      paymentId = paymentEntity.id;
      paymentOrderId = paymentEntity.order_id;
      if (envelope.event === "payment.failed") incomingState = "FAILED";
      else if (envelope.event === "payment.authorized") incomingState = "AUTHORIZED";
      else {
        const fetched = await createRazorpayClient(config).payments.fetch(paymentEntity.id);
        verifiedPayment = normalizeProviderPayment(fetched);
        if (!verifiedPayment) return paymentError(400, "Payment event could not be verified.");
        if (
          verifiedPayment.id !== paymentEntity.id ||
          verifiedPayment.order_id !== paymentEntity.order_id ||
          verifiedPayment.amount !== paymentEntity.amount ||
          verifiedPayment.currency !== paymentEntity.currency ||
          verifiedPayment.status !== "captured" ||
          verifiedPayment.captured !== true
        ) {
          return paymentError(400, "Payment event could not be verified.");
        }
        incomingState = "CAPTURED";
        amountRefundedPaise = verifiedPayment.amount_refunded ?? 0;
        if (verifiedPayment.refund_status === "full") incomingState = "REFUNDED";
        else if (verifiedPayment.refund_status === "partial") incomingState = "PARTIALLY_REFUNDED";
      }
    } else if (envelope.event === "refund.processed") {
      if (refundEntity?.status !== "processed") {
        return paymentError(400, "Invalid webhook request.");
      }
      paymentId = refundEntity.payment_id;
      const fetched = await createRazorpayClient(config).payments.fetch(refundEntity.payment_id);
      verifiedPayment = normalizeProviderPayment(fetched);
      if (!verifiedPayment) return paymentError(400, "Refund event could not be verified.");
      if (
        verifiedPayment.id !== refundEntity.payment_id ||
        verifiedPayment.currency !== refundEntity.currency ||
        verifiedPayment.amount_refunded === undefined ||
        verifiedPayment.amount_refunded < refundEntity.amount ||
        verifiedPayment.amount_refunded > verifiedPayment.amount ||
        !["captured", "refunded"].includes(verifiedPayment.status) ||
        verifiedPayment.captured !== true
      ) {
        return paymentError(400, "Refund event could not be verified.");
      }
      paymentOrderId = verifiedPayment.order_id;
      amountRefundedPaise = verifiedPayment.amount_refunded;
      incomingState = verifiedPayment.refund_status === "full" ? "REFUNDED" : "PARTIALLY_REFUNDED";
    }

    const bodySha256 = createHash("sha256").update(body.text, "utf8").digest("hex");
    const order = paymentOrderId
      ? await prisma.paymentOrder.findUnique({
          where: { razorpayOrderId: paymentOrderId },
          select: { id: true, amountPaise: true, currency: true, status: true },
        })
      : null;

    if (incomingState && paymentId) {
      if (!order || (!verifiedPayment && incomingState === "CAPTURED")) {
        return paymentError(400, "Payment event could not be verified.");
      }
      const amount = verifiedPayment?.amount ?? paymentEntity?.amount;
      const currency = verifiedPayment?.currency ?? paymentEntity?.currency;
      if (amount !== order.amountPaise || currency !== order.currency) {
        return paymentError(400, "Payment event could not be verified.");
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.webhookEvent.create({
          data: { providerEventId: eventId, eventType: envelope.event, bodySha256 },
          select: { id: true },
        });
        if (!incomingState || !paymentId || !order) return;

        const current = await tx.paymentAttempt.findUnique({
          where: { razorpayPaymentId: paymentId },
          select: { orderId: true, status: true },
        });
        if (current && current.orderId !== order.id) throw new Error("Payment order mismatch");
        const state = transitionAttemptState(current?.status, incomingState);
        const amount = verifiedPayment?.amount ?? paymentEntity?.amount;
        const currency = verifiedPayment?.currency ?? paymentEntity?.currency;
        if (amount === undefined || currency === undefined)
          throw new Error("Untrusted payment event");

        await tx.paymentAttempt.upsert({
          where: { razorpayPaymentId: paymentId },
          create: {
            orderId: order.id,
            razorpayPaymentId: paymentId,
            amountPaise: amount,
            amountRefundedPaise,
            currency,
            status: state,
          },
          update: {
            amountRefundedPaise: Math.max(amountRefundedPaise, 0),
            status: state,
          },
        });

        if (state === "CAPTURED" || state === "PARTIALLY_REFUNDED") {
          await tx.paymentOrder.updateMany({
            where: { id: order.id, status: { not: "REFUNDED" } },
            data: { status: "CAPTURED" },
          });
        } else if (state === "REFUNDED") {
          await tx.paymentOrder.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
        }
      });
    } catch (error) {
      if (isDuplicateEventError(error)) return paymentSuccess({ received: true, duplicate: true });
      throw error;
    }
    return paymentSuccess({ received: true });
  } catch {
    return paymentError(503, "Webhook processing is temporarily unavailable.");
  }
}
