import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rateLimitMocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma", () => ({
  getPrismaClient: () => ({ rateLimitBucket: rateLimitMocks }),
}));

import { POST as validateSupplierEnquiry } from "@/app/api/supplier-enquiries/validate/route";
import { buildSupplierWhatsAppMessage, parseSupplierEnquiry } from "@/lib/supplier-enquiry";

function validSubmission(overrides: Record<string, unknown> = {}) {
  return {
    fullName: "Basavaraj Farmer",
    mobile: "+91 8971475042",
    quantity: "2.5",
    unit: "metric tonne",
    grade: "Not Sure",
    villageDistrict: "Example village, Example district",
    notes: "Call after 4pm",
    website: "",
    ...overrides,
  };
}

function validationRequest(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/supplier-enquiries/validate", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      "x-real-ip": "203.0.113.9",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("supplier enquiry validation", () => {
  let requestCount = 0;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("APP_DATABASE_URL", "postgresql://test_user:test_password@127.0.0.1:5432/test_db");
    vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "test_only_rate_limit_secret_1234567890");
    requestCount = 0;
    vi.clearAllMocks();
    rateLimitMocks.deleteMany.mockResolvedValue({ count: 0 });
    rateLimitMocks.upsert.mockImplementation(() => ({ count: ++requestCount }));
  });

  afterEach(() => vi.unstubAllEnvs());

  it("requires a name, mobile, quantity and village or town with district", () => {
    const result = parseSupplierEnquiry({
      unit: "kg",
      grade: "Standard",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.fullName).toBeDefined();
      expect(result.errors.mobile).toBeDefined();
      expect(result.errors.quantity).toBeDefined();
      expect(result.errors.villageDistrict).toBeDefined();
    }
  });

  it("normalizes an Indian mobile number and converts metric tonnes to kilograms", () => {
    const result = parseSupplierEnquiry(validSubmission());
    expect(result).toMatchObject({
      success: true,
      data: { mobile: "+918971475042", quantityKilograms: 2_500 },
    });
  });

  it("converts quintals and accepts a mobile number with a leading zero", () => {
    const result = parseSupplierEnquiry(
      validSubmission({ mobile: "08971475042", quantity: "5", unit: "quintal" }),
    );
    expect(result).toMatchObject({
      success: true,
      data: { mobile: "+918971475042", quantityKilograms: 500 },
    });
  });

  it("builds a supplier message with quantity units and normalized kilograms", () => {
    const result = parseSupplierEnquiry(validSubmission());
    expect(result.success).toBe(true);
    if (result.success) {
      const message = buildSupplierWhatsAppMessage(result.data);
      expect(message).toContain("Available quantity: 2.5 metric tonne (2,500 kg equivalent)");
      expect(message).toContain("Mobile: +918971475042");
      expect(message).toContain("Village/town and district: Example village, Example district");
    }
  });

  it.each(["1234567890", "98765", "+91 12345abcde"])(
    "rejects malformed Indian mobile number %s",
    (mobile) => {
      const result = parseSupplierEnquiry(validSubmission({ mobile }));
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.mobile).toBeDefined();
    },
  );

  it.each(["0", "-2", "1e6", "1000001"])(
    "rejects malformed or unreasonable quantity %s",
    (quantity) => {
      const result = parseSupplierEnquiry(validSubmission({ quantity, unit: "kg" }));
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.quantity).toBeDefined();
    },
  );

  it("rejects unsupported units, grades, extra fields and an occupied honeypot", () => {
    for (const invalid of [
      validSubmission({ unit: "bag" }),
      validSubmission({ grade: "Certified" }),
      validSubmission({ unexpected: "value" }),
      validSubmission({ website: "spam" }),
    ]) {
      expect(parseSupplierEnquiry(invalid).success).toBe(false);
    }
  });

  it("rejects cross-origin and malformed requests without returning submitted details", async () => {
    const crossOrigin = await validateSupplierEnquiry(
      validationRequest(validSubmission(), "https://attacker.example"),
    );
    expect(crossOrigin.status).toBe(403);

    const malformed = await validateSupplierEnquiry(validationRequest("{"));
    expect(malformed.status).toBe(400);

    const valid = await validateSupplierEnquiry(validationRequest(validSubmission()));
    expect(valid.status).toBe(200);
    const response = await valid.json();
    expect(response).toEqual({ valid: true });
    expect(JSON.stringify(response)).not.toContain("Basavaraj Farmer");
  });

  it("rate limits repeated requests through the existing shared rate-limit table", async () => {
    const responses: number[] = [];
    for (let index = 0; index < 6; index += 1) {
      responses.push((await validateSupplierEnquiry(validationRequest(validSubmission()))).status);
    }

    expect(responses).toEqual([200, 200, 200, 200, 200, 429]);
    const subjectHash =
      rateLimitMocks.upsert.mock.calls[0]?.[0].where.subjectHash_windowStart.subjectHash;
    expect(subjectHash).toMatch(/^[a-f0-9]{64}$/);
    expect(subjectHash).not.toContain("203.0.113.9");
  });
});
