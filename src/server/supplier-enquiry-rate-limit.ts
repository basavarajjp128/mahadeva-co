import "server-only";

import { createHmac } from "node:crypto";
import { trustedClientAddress } from "@/server/payment-rate-limit";
import { getPrismaClient } from "@/server/prisma";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const developmentBuckets = new Map<string, { windowStart: number; count: number }>();

type RateLimitResult = "allowed" | "limited" | "unavailable";

function consumeDevelopmentBucket(now: number): RateLimitResult {
  const windowStart = Math.floor(now / RATE_WINDOW_MS) * RATE_WINDOW_MS;
  for (const [key, bucket] of developmentBuckets) {
    if (bucket.windowStart < now - RATE_WINDOW_MS) developmentBuckets.delete(key);
  }
  const key = "local-development";
  const bucket = developmentBuckets.get(key);
  if (!bucket || bucket.windowStart !== windowStart) {
    developmentBuckets.set(key, { windowStart, count: 1 });
    return "allowed";
  }
  bucket.count += 1;
  return bucket.count <= MAX_REQUESTS_PER_WINDOW ? "allowed" : "limited";
}

export async function consumeSupplierEnquiryRateLimit(
  request: Request,
  now = Date.now(),
): Promise<RateLimitResult> {
  const address = trustedClientAddress(request);
  if (!address) return "unavailable";

  const databaseUrl = process.env.APP_DATABASE_URL;
  const secret = process.env.RATE_LIMIT_HMAC_SECRET;
  if (!databaseUrl || !secret || secret.length < 32) {
    return process.env.NODE_ENV === "production" ? "unavailable" : consumeDevelopmentBucket(now);
  }

  const subjectHash = createHmac("sha256", secret)
    .update(`supplier-enquiry:${address}`)
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
    return bucket.count <= MAX_REQUESTS_PER_WINDOW ? "allowed" : "limited";
  } catch {
    return process.env.NODE_ENV === "production" ? "unavailable" : consumeDevelopmentBucket(now);
  }
}
