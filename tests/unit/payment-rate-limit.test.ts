import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bucketMocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma", () => ({
  getPrismaClient: () => ({ rateLimitBucket: bucketMocks }),
}));

import { consumeOrderRateLimit } from "@/server/payment-rate-limit";

const config = {
  APP_DATABASE_URL: "postgresql://test_user:test_password@127.0.0.1:5432/test_db",
  APP_ORIGIN: "http://localhost:3000",
  RAZORPAY_KEY_ID: "rzp_test_ABCDEFGHIJKLMNOP",
  RAZORPAY_KEY_SECRET: "test_only_secret_for_unit_tests",
  RAZORPAY_WEBHOOK_SECRET: "test_only_webhook_secret",
  RATE_LIMIT_HMAC_SECRET: "test_only_rate_limit_secret_1234567890",
};

describe("payment order rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bucketMocks.deleteMany.mockResolvedValue({ count: 0 });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("limits repeated order creation per hashed trusted IP and expires old buckets", async () => {
    bucketMocks.upsert.mockResolvedValueOnce({ count: 10 }).mockResolvedValueOnce({ count: 11 });
    const request = new Request("http://localhost:3000/api/payments/orders", {
      headers: { "x-real-ip": "203.0.113.9" },
    });
    expect(await consumeOrderRateLimit(request, config, 1_800_000)).toBe("allowed");
    expect(await consumeOrderRateLimit(request, config, 1_800_001)).toBe("limited");
    expect(bucketMocks.deleteMany).toHaveBeenCalledWith({
      where: { windowStart: { lt: expect.any(Date) } },
    });
    const uniqueWhere = bucketMocks.upsert.mock.calls[0]?.[0].where.subjectHash_windowStart;
    expect(uniqueWhere.subjectHash).not.toBe("203.0.113.9");
    expect(uniqueWhere.subjectHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed if production ingress does not supply a trusted client address", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const request = new Request("https://shop.example/api/payments/orders");
    expect(await consumeOrderRateLimit(request, config)).toBe("unavailable");
    expect(bucketMocks.upsert).not.toHaveBeenCalled();
  });
});
