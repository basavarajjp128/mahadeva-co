import "server-only";

import { products } from "@/data/products";
import { getTestCheckoutPrice, getTestPrice } from "@/server/payment-test-pricing";

export type VerifiedPrice = {
  currency: string;
  /** Integer minor currency units charged per kilogram, maintained by the business. */
  pricePerKgMinor: number;
  /** Must be explicitly confirmed after applicable tax and fee rules are settled. */
  finalPricePolicyConfirmed: boolean;
  /** Must be explicitly enabled only after the business confirms sale eligibility. */
  onlineCheckoutApproved: boolean;
};

/**
 * Deliberately empty until the owner supplies verified product pricing, currency,
 * and confirms the final amount policy. Sample catalogue items are never purchasable.
 */
const verifiedPrices: Partial<Record<string, VerifiedPrice>> = {};

export function getVerifiedPrice(productSlug: string): VerifiedPrice | null {
  const product = products.find((item) => item.slug === productSlug);
  const price = verifiedPrices[productSlug];
  if (
    !product ||
    product.isSample ||
    !price ||
    !price.finalPricePolicyConfirmed ||
    !price.onlineCheckoutApproved
  ) {
    return null;
  }
  if (
    !/^[A-Z]{3}$/.test(price.currency) ||
    !Number.isSafeInteger(price.pricePerKgMinor) ||
    price.pricePerKgMinor <= 0
  ) {
    return null;
  }
  return price;
}

/** Test-only price takes precedence only for the exact opt-in local fixture. */
export function getDisplayPrice(productSlug: string): VerifiedPrice | null {
  const testPrice = getTestPrice(productSlug);
  if (testPrice) {
    return {
      currency: testPrice.currency,
      pricePerKgMinor: testPrice.pricePerKgMinor,
      finalPricePolicyConfirmed: false,
      onlineCheckoutApproved: testPrice.directCheckoutAllowed,
    };
  }
  return getVerifiedPrice(productSlug);
}

/** Checkout prices for test fixtures are returned only in the opt-in non-production mode. */
export function getCheckoutPrice(productSlug: string): VerifiedPrice | null {
  const testPrice = getTestCheckoutPrice(productSlug);
  if (testPrice) {
    return {
      currency: testPrice.currency,
      pricePerKgMinor: testPrice.pricePerKgMinor,
      finalPricePolicyConfirmed: true,
      onlineCheckoutApproved: true,
    };
  }
  return getVerifiedPrice(productSlug);
}

export function hasAnyVerifiedPaymentPrice(): boolean {
  return products.some((product) => getVerifiedPrice(product.slug) !== null);
}
