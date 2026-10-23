import { isQuantityUnit, quantityUnits, type QuantityUnit } from "@/lib/quantity";

export const DIRECT_CHECKOUT_LIMIT_MILLI_KG = 300_000;
export const MAX_PAYMENT_REQUEST_BYTES = 16 * 1024;
const ONE_THOUSAND = BigInt(1000);
const FIVE_HUNDRED = BigInt(500);

export type PaymentQuantity = {
  quantity: string;
  unit: QuantityUnit;
  milliKilograms: bigint;
};

export function parsePaymentQuantity(quantity: unknown, unit: unknown): PaymentQuantity | null {
  if (typeof quantity !== "string" || quantity.length > 16 || typeof unit !== "string") return null;
  if (!quantityUnits.some((supportedUnit) => supportedUnit === unit)) return null;
  if (!/^(?:\d{1,9}(?:\.\d{1,3})?|\.\d{1,3})$/.test(quantity.trim())) return null;

  const [whole = "0", fraction = ""] = quantity.trim().replace(/^\./, "0.").split(".");
  const quantityMilli = BigInt(whole) * ONE_THOUSAND + BigInt(fraction.padEnd(3, "0") || "0");
  const multiplier = unit === "kg" ? BigInt(1) : unit === "quintal" ? BigInt(100) : ONE_THOUSAND;
  const milliKilograms = quantityMilli * multiplier;
  if (milliKilograms <= BigInt(0)) return null;
  return { quantity: quantity.trim(), unit: unit as QuantityUnit, milliKilograms };
}

export function isEligibleForDirectCheckout(milliKilograms: bigint): boolean {
  return milliKilograms > BigInt(0) && milliKilograms < BigInt(DIRECT_CHECKOUT_LIMIT_MILLI_KG);
}

/** Round the exact paise result to the nearest paise, with half-paise rounded upward. */
export function calculateAmountMinor(
  milliKilograms: bigint,
  pricePerKgMinor: number,
): number | null {
  if (
    milliKilograms <= BigInt(0) ||
    !Number.isSafeInteger(pricePerKgMinor) ||
    pricePerKgMinor <= 0
  ) {
    return null;
  }
  const numerator = milliKilograms * BigInt(pricePerKgMinor);
  const roundedMinor = (numerator + FIVE_HUNDRED) / ONE_THOUSAND;
  if (roundedMinor <= BigInt(0) || roundedMinor > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(roundedMinor);
}

export function isSupportedPaymentUnit(unit: unknown): unit is QuantityUnit {
  return typeof unit === "string" && isQuantityUnit(unit);
}
