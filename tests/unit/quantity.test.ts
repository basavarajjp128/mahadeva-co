import { describe, expect, it } from "vitest";
import { MAX_QUANTITY_KG, formatQuantity, toKilograms, validateQuantity } from "@/lib/quantity";

describe("quantity conversion and validation", () => {
  it.each([
    ["1", "kg", 1],
    ["1", "quintal", 100],
    ["1", "metric ton", 1_000],
    ["2.5", "quintal", 250],
    ["0.125", "metric ton", 125],
  ])("converts %s %s to %s kg", (value, unit, kilograms) => {
    expect(validateQuantity(value, unit)).toEqual({
      valid: true,
      entered: Number(value),
      unit,
      kilograms,
    });
  });

  it.each(["", " ", "0", "-1", "+1", "1e3", "Infinity", "NaN", "1,000", "1.1234", "."])(
    "rejects invalid input %j",
    (value) => {
      expect(validateQuantity(value, "kg").valid).toBe(false);
    },
  );

  it("rejects an unsupported unit", () => {
    expect(validateQuantity("1", "pound")).toMatchObject({ valid: false });
  });

  it("accepts the maximum equivalent quantity and rejects values above it", () => {
    expect(validateQuantity(String(MAX_QUANTITY_KG), "kg").valid).toBe(true);
    expect(validateQuantity(String(MAX_QUANTITY_KG + 1), "kg").valid).toBe(false);
    expect(validateQuantity(String(MAX_QUANTITY_KG / 100), "quintal").valid).toBe(true);
    expect(validateQuantity(String(MAX_QUANTITY_KG / 1_000 + 0.001), "metric ton").valid).toBe(
      false,
    );
  });

  it("keeps conversions finite and formats values for Indian readers", () => {
    expect(toKilograms(1_000, "metric ton")).toBe(1_000_000);
    expect(formatQuantity(100_000)).toBe("1,00,000");
  });
});
