import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getCatalogueProducts, isTestCatalogueEnabled } from "@/data/catalogue";
import { testProducts } from "@/data/test-products";
import { getTestCheckoutPrice, getTestPrice } from "@/server/payment-test-pricing";

describe("development-only copra test catalogue", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("requires an explicit switch outside production", () => {
    expect(
      isTestCatalogueEnabled({ NODE_ENV: "development", ENABLE_PAYMENT_TEST_DATA: "false" }),
    ).toBe(false);
    expect(
      getCatalogueProducts({ NODE_ENV: "development", ENABLE_PAYMENT_TEST_DATA: "false" }),
    ).toHaveLength(1);
  });

  it("exposes only labeled fixture products when opted in for local development", () => {
    const catalogue = getCatalogueProducts({
      NODE_ENV: "development",
      ENABLE_PAYMENT_TEST_DATA: "true",
    });
    expect(catalogue.filter((product) => product.isTestData)).toEqual(testProducts);
    expect(catalogue.filter((product) => product.isTestData)).toHaveLength(4);
    expect(catalogue.every((product) => product.isTestData || product.slug === "copra")).toBe(true);
  });

  it("never exposes fixture products or test prices when NODE_ENV is production", () => {
    const production = { NODE_ENV: "production", ENABLE_PAYMENT_TEST_DATA: "true" };
    expect(isTestCatalogueEnabled(production)).toBe(false);
    expect(getCatalogueProducts(production).some((product) => product.isTestData)).toBe(false);
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
