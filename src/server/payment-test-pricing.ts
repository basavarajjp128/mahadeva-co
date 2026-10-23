import "server-only";

import { isTestCatalogueEnabled } from "@/data/catalogue";

export type TestPrice = {
  currency: "INR";
  /** ₹35/kg fixture price, stored in paise. Never a business price. */
  pricePerKgMinor: 3500;
  directCheckoutAllowed: boolean;
};

const testPrices: Record<string, TestPrice> = {
  "test-standard-dried-copra": {
    currency: "INR",
    pricePerKgMinor: 3500,
    directCheckoutAllowed: true,
  },
  "test-premium-dried-copra": {
    currency: "INR",
    pricePerKgMinor: 3500,
    directCheckoutAllowed: true,
  },
  "test-wholesale-copra": {
    currency: "INR",
    pricePerKgMinor: 3500,
    directCheckoutAllowed: false,
  },
  "test-bulk-copra-supply": {
    currency: "INR",
    pricePerKgMinor: 3500,
    directCheckoutAllowed: false,
  },
};

export function getTestPrice(
  productSlug: string,
  environment?: Record<string, string | undefined>,
): TestPrice | null {
  if (!environment) {
    if (process.env.NODE_ENV === "production") return null;
    if (process.env.ENABLE_PAYMENT_TEST_DATA !== "true") return null;
    return testPrices[productSlug] ?? null;
  }
  if (!isTestCatalogueEnabled(environment)) return null;
  return testPrices[productSlug] ?? null;
}

export function getTestCheckoutPrice(
  productSlug: string,
  environment?: Record<string, string | undefined>,
): TestPrice | null {
  const price = getTestPrice(productSlug, environment);
  return price?.directCheckoutAllowed ? price : null;
}
