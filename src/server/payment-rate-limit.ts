import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getPrismaClient } from "@/server/prisma";
import type { ServerPaymentEnv } from "@/server/payment-env";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_CREATE_ORDER_REQUESTS = 10;

export function trustedClientAddress(request: Request): string | null {
  // Production ingress must overwrite this header and prevent direct origin access.
  const value = request.headers.get("x-real-ip")?.trim();
  if (value && !value.includes(",") && isIP(value)) return value;
  if (process.env.NODE_ENV !== "production") return "local-development";
  return null;
}

export async function consumeOrderRateLimit(
  request: Request,
  config: ServerPaymentEnv,
  now = Date.now(),
): Promise<"allowed" | "limited" | "unavailable"> {
  const address = trustedClientAddress(request);
  if (!address) return "unavailable";
  const subjectHash = createHmac("sha256", config.RATE_LIMIT_HMAC_SECRET)
    .update(address)
    .digest("hex");
  const windowStart = new Date(Math.floor(now / RATE_WINDOW_MS) * RATE_WINDOW_MS);

  try {
    const prisma = getPrismaClient();
    await prisma.rateLimitBucket.deleteMany({
      where: { windowStart: { lt: new Date(now - 24 * 60 * 60 * 1000) } },
    });
    const bucket = await prisma.rateLimitBucket.upsert({
      where: { subjectHash_windowStart: { subjectHash, windowStart } },
      create: { subjectHash, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    return bucket.count <= MAX_CREATE_ORDER_REQUESTS ? "allowed" : "limited";
  } catch {
    return "unavailable";
  }
}
