import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readServerPaymentEnv } from "@/server/payment-env";

const baseEnvironment = {
  APP_DATABASE_URL: "postgresql://runtime:password@db.example.test:5432/postgres?sslmode=require",
  APP_ORIGIN: "https://mahadeva.example",
  RAZORPAY_KEY_ID: "rzp_test_ABCDEFGHIJKLMNOP",
  RAZORPAY_KEY_SECRET: "test_only_secret_for_payment_unit_tests",
  RAZORPAY_WEBHOOK_SECRET: "test_only_webhook_secret_for_unit_tests",
  RATE_LIMIT_HMAC_SECRET: "test_only_rate_limit_secret_1234567890",
};

describe("payment server environment", () => {
  it("accepts the dedicated runtime connection string", () => {
    expect(readServerPaymentEnv(baseEnvironment)?.APP_DATABASE_URL).toBe(
      baseEnvironment.APP_DATABASE_URL,
    );
  });

  it("does not treat the Prisma CLI migration URL as a runtime connection", () => {
    const { APP_DATABASE_URL: _runtimeUrl, ...migrationOnly } = baseEnvironment;
    expect(
      readServerPaymentEnv({
        ...migrationOnly,
        DATABASE_URL: "postgresql://migration:password@db.example.test:5432/postgres",
      }),
    ).toBeNull();
  });
});
