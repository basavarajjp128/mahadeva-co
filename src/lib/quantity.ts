export const quantityUnits = ["kg", "quintal", "metric ton"] as const;

export type QuantityUnit = (typeof quantityUnits)[number];

export const MAX_QUANTITY_KG = 1_000_000;

const kilogramsPerUnit: Record<QuantityUnit, number> = {
  kg: 1,
  quintal: 100,
  "metric ton": 1_000,
};

export type QuantityResult =
  | { valid: true; entered: number; unit: QuantityUnit; kilograms: number }
  | { valid: false; error: string };

export function isQuantityUnit(value: string): value is QuantityUnit {
  return quantityUnits.some((unit) => unit === value);
}

export function toKilograms(value: number, unit: QuantityUnit): number {
  return value * kilogramsPerUnit[unit];
}

export function validateQuantity(value: string, unit: string): QuantityResult {
  if (!isQuantityUnit(unit)) {
    return { valid: false, error: "Choose kg, quintal or metric ton." };
  }

  const trimmed = value.trim();
  if (!trimmed || !/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(trimmed)) {
    return { valid: false, error: "Enter a quantity using up to three decimal places." };
  }

  const entered = Number(trimmed);
  if (!Number.isFinite(entered) || entered <= 0) {
    return { valid: false, error: "Quantity must be a finite number greater than zero." };
  }

  const kilograms = toKilograms(entered, unit);
  if (kilograms > MAX_QUANTITY_KG) {
    return {
      valid: false,
      error: `Enter no more than ${MAX_QUANTITY_KG.toLocaleString("en-IN")} kg equivalent.`,
    };
  }

  return { valid: true, entered, unit, kilograms };
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(value);
}
