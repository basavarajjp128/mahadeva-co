import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const paymentMocks = vi.hoisted(() => ({
  prisma: {
    paymentOrder: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    paymentAttempt: { findUnique: vi.fn(), upsert: vi.fn() },
    webhookEvent: { create: vi.fn() },
    rateLimitBucket: { deleteMany: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
  razorpay: { payments: { fetch: vi.fn() }, orders: { create: vi.fn() } },
}));
const { getActiveProductBySlug } = vi.hoisted(() => ({ getActiveProductBySlug: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma", () => ({ getPrismaClient: () => paymentMocks.prisma }));
vi.mock("@/server/razorpay", () => ({ createRazorpayClient: () => paymentMocks.razorpay }));
vi.mock("@/server/catalogue", () => ({ getActiveProductBySlug }));

import { createHmac } from "node:crypto";
import { POST as createOrder } from "@/app/api/payments/orders/route";
import { POST as verifyPayment } from "@/app/api/payments/verify/route";
import { POST as receiveWebhook } from "@/app/api/payments/webhook/route";
import { sampleProduct } from "../fixtures/product";
import { testProducts } from "@/data/test-products";

function setTestPaymentEnvironment() {
  vi.stubEnv("APP_DATABASE_URL", "postgresql://test_user:test_password@127.0.0.1:5432/test_db");
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_ABCDEFGHIJKLMNOP");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "test_only_secret_for_payment_unit_tests");
  vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "test_only_webhook_secret_for_unit_tests");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "test_only_rate_limit_secret_1234567890");
}

function makeTransaction() {
  const tx = {
    webhookEvent: { create: paymentMocks.prisma.webhookEvent.create },
    paymentAttempt: {
      findUnique: paymentMocks.prisma.paymentAttempt.findUnique,
      upsert: paymentMocks.prisma.paymentAttempt.upsert,
    },
    paymentOrder: { updateMany: vi.fn(), update: vi.fn() },
  };
  paymentMocks.prisma.$transaction.mockImplementation(
    async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
  );
  return tx;
}

function request(path: string, body: unknown, origin = "http://localhost:3000") {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("payment route boundaries", () => {
  beforeEach(() => {
    setTestPaymentEnvironment();
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "false");
    vi.clearAllMocks();
    getActiveProductBySlug.mockImplementation(async (slug: string) =>
      slug === "copra"
        ? sampleProduct
        : (testProducts.find((product) => product.slug === slug) ?? null),
    );
    paymentMocks.prisma.paymentOrder.findUnique.mockResolvedValue(null);
    paymentMocks.prisma.paymentAttempt.findUnique.mockResolvedValue(null);
    paymentMocks.prisma.paymentAttempt.upsert.mockResolvedValue({});
    paymentMocks.prisma.webhookEvent.create.mockResolvedValue({ id: "event-row" });
    paymentMocks.prisma.rateLimitBucket.deleteMany.mockResolvedValue({ count: 0 });
    paymentMocks.prisma.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });
    paymentMocks.prisma.paymentOrder.create.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
    });
    paymentMocks.prisma.paymentOrder.update.mockResolvedValue({});
    paymentMocks.razorpay.orders.create.mockResolvedValue({
      id: "order_test123",
      amount: 87_500,
      currency: "INR",
    });
    paymentMocks.razorpay.payments.fetch.mockResolvedValue({});
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects cross-origin order creation and never uses browser-supplied totals", async () => {
    const crossOrigin = await createOrder(
      request(
        "/api/payments/orders",
        { productSlug: "copra", quantity: "2", unit: "kg" },
        "https://attacker.example",
      ),
    );
    expect(crossOrigin.status).toBe(403);

    const tamperedTotal = await createOrder(
      request("/api/payments/orders", {
        productSlug: "copra",
        quantity: "2",
        unit: "kg",
        amount: 1,
      }),
    );
    expect(tamperedTotal.status).toBe(400);
  });

  it("fails closed while the sample catalogue has no verified prices", async () => {
    const response = await createOrder(
      request("/api/payments/orders", { productSlug: "copra", quantity: "2", unit: "kg" }),
    );
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("not configured"),
    });
  });

  it("uses the active database product price for the server-calculated Razorpay order", async () => {
    getActiveProductBySlug.mockResolvedValueOnce({
      ...sampleProduct,
      isSample: false,
      price: "40.00",
      priceCurrency: "INR",
      priceUnit: "KG",
      supportedSalesUnits: ["KG"],
      isDirectCheckoutEnabled: true,
    });
    paymentMocks.razorpay.orders.create.mockResolvedValueOnce({
      id: "order_databaseprice",
      amount: 8_000,
      currency: "INR",
    });

    const response = await createOrder(
      request("/api/payments/orders", { productSlug: "copra", quantity: "2", unit: "kg" }),
    );

    expect(response.status).toBe(200);
    expect(paymentMocks.prisma.paymentOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productSlug: "copra",
          quantityKilograms: 2,
          unitPricePaise: 4_000,
          amountPaise: 8_000,
        }),
      }),
    );
    expect(paymentMocks.razorpay.orders.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 8_000, currency: "INR" }),
    );
  });

  it("creates a ₹35/kg Razorpay test order below 300 kg and rejects 300 kg", async () => {
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "true");
    const underLimit = await createOrder(
      request("/api/payments/orders", {
        productSlug: "test-standard-dried-copra",
        quantity: "25",
        unit: "kg",
      }),
    );
    expect(underLimit.status).toBe(200);
    await expect(underLimit.json()).resolves.toMatchObject({
      amount: 87_500,
      currency: "INR",
    });
    expect(paymentMocks.razorpay.orders.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 87_500, currency: "INR" }),
    );

    const atLimit = await createOrder(
      request("/api/payments/orders", {
        productSlug: "test-standard-dried-copra",
        quantity: "300",
        unit: "kg",
      }),
    );
    expect(atLimit.status).toBe(422);
    expect(paymentMocks.razorpay.orders.create).toHaveBeenCalledTimes(1);
  });

  it("does not allow the enquiry-only fixture into direct checkout", async () => {
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "true");
    const response = await createOrder(
      request("/api/payments/orders", {
        productSlug: "test-wholesale-copra",
        quantity: "25",
        unit: "kg",
      }),
    );
    expect(response.status).toBe(422);
    expect(paymentMocks.razorpay.orders.create).not.toHaveBeenCalled();
  });

  it("rejects development test products in production even if the test switch is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "true");
    const response = await createOrder(
      request("/api/payments/orders", {
        productSlug: "test-standard-dried-copra",
        quantity: "25",
        unit: "kg",
      }),
    );
    expect(response.status).toBe(422);
    expect(paymentMocks.prisma.paymentOrder.create).not.toHaveBeenCalled();
    expect(paymentMocks.razorpay.orders.create).not.toHaveBeenCalled();
  });

  it("rejects forged payment success signatures before database access", async () => {
    const response = await verifyPayment(
      request("/api/payments/verify", {
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_456",
        razorpay_signature: "0".repeat(64),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects forged webhook signatures before parsing or database access", async () => {
    const response = await receiveWebhook(
      new Request("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-event-id": "event_test_1",
          "x-razorpay-signature": "0".repeat(64),
        },
        body: JSON.stringify({ event: "payment.captured", payload: {} }),
      }),
    );
    expect(response.status).toBe(400);
    expect(paymentMocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("accepts a signed captured event only after checking provider amount and status", async () => {
    const payload = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_456",
            order_id: "order_123",
            amount: 5000,
            currency: "INR",
            status: "captured",
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const signature = createHmac("sha256", "test_only_webhook_secret_for_unit_tests")
      .update(rawBody)
      .digest("hex");
    paymentMocks.prisma.paymentOrder.findUnique.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      amountPaise: 5000,
      currency: "INR",
      status: "PENDING",
    });
    paymentMocks.razorpay.payments.fetch.mockResolvedValue({
      id: "pay_456",
      order_id: "order_123",
      amount: 5000,
      currency: "INR",
      status: "captured",
      captured: true,
      amount_refunded: 0,
      refund_status: "null",
    });
    const tx = makeTransaction();
    const response = await receiveWebhook(
      new Request("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-event-id": "event_test_2",
          "x-razorpay-signature": signature,
        },
        body: rawBody,
      }),
    );

    expect(response.status).toBe(200);
    expect(paymentMocks.razorpay.payments.fetch).toHaveBeenCalledWith("pay_456");
    expect(tx.paymentAttempt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: "CAPTURED", amountPaise: 5000 }),
      }),
    );
    expect(tx.paymentOrder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "CAPTURED" } }),
    );
  });

  it("acknowledges duplicate webhook IDs without applying the event twice", async () => {
    const rawBody = JSON.stringify({ event: "unknown.event", payload: {} });
    const signature = createHmac("sha256", "test_only_webhook_secret_for_unit_tests")
      .update(rawBody)
      .digest("hex");
    const tx = makeTransaction();
    paymentMocks.prisma.webhookEvent.create.mockRejectedValue({ code: "P2002" });
    const response = await receiveWebhook(
      new Request("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-event-id": "event_duplicate_1",
          "x-razorpay-signature": signature,
        },
        body: rawBody,
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, duplicate: true });
    expect(tx.paymentAttempt.upsert).not.toHaveBeenCalled();
  });

  it("rejects malformed and oversized JSON requests", async () => {
    const malformed = await createOrder(
      new Request("http://localhost:3000/api/payments/orders", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "content-type": "application/json" },
        body: "{",
      }),
    );
    expect(malformed.status).toBe(400);

    const oversized = await createOrder(
      new Request("http://localhost:3000/api/payments/orders", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
          "content-length": "20000",
        },
        body: JSON.stringify({ productSlug: "copra", quantity: "2", unit: "kg" }),
      }),
    );
    expect(oversized.status).toBe(413);
  });
});
