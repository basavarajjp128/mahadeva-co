import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getCheckoutPrice, getVerifiedPrice } from "@/server/payment-pricing";
import { sampleProduct } from "../fixtures/product";

describe("database-backed checkout pricing", () => {
  it("converts the trusted database INR/kg decimal to integer paise", () => {
    const product = {
      ...sampleProduct,
      isSample: false,
      price: "35.25",
      priceCurrency: "INR",
      priceUnit: "KG" as const,
      supportedSalesUnits: ["KG" as const],
      isDirectCheckoutEnabled: true,
    };
    expect(getCheckoutPrice(product)).toMatchObject({
      currency: "INR",
      pricePerKgMinor: 3525,
      finalPricePolicyConfirmed: true,
      onlineCheckoutApproved: true,
    });
  });

  it.each([
    { isActive: false },
    { isSample: true },
    { isDirectCheckoutEnabled: false },
    { price: null },
    { priceCurrency: "USD" },
    { priceUnit: "QUINTAL" },
    { supportedSalesUnits: [] },
    { price: "35.255" },
  ])("keeps unapproved or unsupported product price out of checkout: %o", (changes) => {
    const product = {
      ...sampleProduct,
      isSample: false,
      price: "35.00",
      priceCurrency: "INR",
      priceUnit: "KG" as const,
      supportedSalesUnits: ["KG" as const],
      isDirectCheckoutEnabled: true,
      ...changes,
    };
    expect(getVerifiedPrice(product as typeof sampleProduct)).toBeNull();
  });

  it("never uses the database price for a sample product", () => {
    expect(
      getVerifiedPrice({
        ...sampleProduct,
        price: "35.00",
        priceCurrency: "INR",
        priceUnit: "KG",
        supportedSalesUnits: ["KG"],
        isDirectCheckoutEnabled: true,
      }),
    ).toBeNull();
  });
});
