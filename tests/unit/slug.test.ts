import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it.each([
    ["Premium Dried Copra", "premium-dried-copra"],
    ["  Bulk  Copra  Supply  ", "bulk-copra-supply"],
    ["Copra (Grade A) — 2026", "copra-grade-a-2026"],
    ["Café Copra", "cafe-copra"],
    ["already-a-slug", "already-a-slug"],
    ["---", ""],
  ])("turns %j into %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("stays inside the slug length limit used by the schema", () => {
    const slug = slugify("copra ".repeat(60));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});
