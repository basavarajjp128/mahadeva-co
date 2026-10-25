import "server-only";

import type { Product } from "@/types/product";
import { getTestCheckoutPrice, getTestPrice } from "@/server/payment-test-pricing";

export type VerifiedPrice = {
  currency: string;
  /** Integer minor currency units charged per kilogram. */
  pricePerKgMinor: number;
  finalPricePolicyConfirmed: boolean;
  onlineCheckoutApproved: boolean;
};

function parseInrPerKilogramMinor(price: string | null): number | null {
  if (!price) return null;
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(price);
  if (!match) return null;
  const paise = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  if (paise <= 0n || paise > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(paise);
}

export function getVerifiedPrice(product: Product | null): VerifiedPrice | null {
  if (
    !product?.isActive ||
    product.isSample ||
    product.isTestData ||
    !product.isDirectCheckoutEnabled ||
    product.priceCurrency !== "INR" ||
    product.priceUnit !== "KG" ||
    !product.supportedSalesUnits.includes("KG")
  ) {
    return null;
  }

  const pricePerKgMinor = parseInrPerKilogramMinor(product.price);
  if (pricePerKgMinor === null) return null;

  return {
    currency: "INR",
    pricePerKgMinor,
    finalPricePolicyConfirmed: true,
    onlineCheckoutApproved: true,
  };
}

/** Test-only price takes precedence only for the exact opt-in local fixture. */
export function getDisplayPrice(product: Product | null): VerifiedPrice | null {
  if (!product) return null;
  const testPrice = product.isTestData ? getTestPrice(product.slug) : null;
  if (testPrice) {
    return {
      currency: testPrice.currency,
      pricePerKgMinor: testPrice.pricePerKgMinor,
      finalPricePolicyConfirmed: false,
      onlineCheckoutApproved: testPrice.directCheckoutAllowed,
    };
  }
  return getVerifiedPrice(product);
}

/** Database product price or explicitly opted-in development fixture price. */
export function getCheckoutPrice(product: Product | null): VerifiedPrice | null {
  if (!product) return null;
  if (product.isTestData) {
    const testPrice = getTestCheckoutPrice(product.slug);
    return testPrice
      ? {
          currency: testPrice.currency,
          pricePerKgMinor: testPrice.pricePerKgMinor,
          finalPricePolicyConfirmed: true,
          onlineCheckoutApproved: true,
        }
      : null;
  }
  return getVerifiedPrice(product);
}
