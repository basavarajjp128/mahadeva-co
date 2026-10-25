import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isTestCatalogueEnabled } from "@/data/catalogue";
import { testProducts } from "@/data/test-products";
import { getTestCheckoutPrice, getTestPrice } from "@/server/payment-test-pricing";

describe("development-only copra test catalogue", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("requires an explicit switch outside production", () => {
    expect(
      isTestCatalogueEnabled({ NODE_ENV: "development", ENABLE_PAYMENT_TEST_DATA: "false" }),
    ).toBe(false);
    expect(testProducts.every((product) => product.isTestData)).toBe(true);
  });

  it("exposes only labeled fixture products when opted in for local development", () => {
    expect(
      isTestCatalogueEnabled({ NODE_ENV: "development", ENABLE_PAYMENT_TEST_DATA: "true" }),
    ).toBe(true);
    expect(testProducts).toHaveLength(4);
    expect(testProducts.every((product) => product.isTestData && product.isSample)).toBe(true);
  });

  it("never exposes fixture products or test prices when NODE_ENV is production", () => {
    const production = { NODE_ENV: "production", ENABLE_PAYMENT_TEST_DATA: "true" };
    expect(isTestCatalogueEnabled(production)).toBe(false);
    expect(getTestPrice("test-standard-dried-copra", production)).toBeNull();
    expect(getTestCheckoutPrice("test-standard-dried-copra", production)).toBeNull();
  });

  it("keeps direct-sale and enquiry-only test fixtures distinct", () => {
    const development = { NODE_ENV: "test", ENABLE_PAYMENT_TEST_DATA: "true" };
    expect(getTestPrice("test-standard-dried-copra", development)?.pricePerKgMinor).toBe(3500);
    expect(
      getTestCheckoutPrice("test-standard-dried-copra", development)?.directCheckoutAllowed,
    ).toBe(true);
    expect(getTestPrice("test-wholesale-copra", development)?.pricePerKgMinor).toBe(3500);
    expect(getTestCheckoutPrice("test-wholesale-copra", development)).toBeNull();
  });
});
