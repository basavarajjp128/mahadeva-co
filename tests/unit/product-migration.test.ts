import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "prisma/migrations/20261025000000_product_catalogue/migration.sql",
  "utf8",
);

describe("product catalogue migration safety", () => {
  it("extends the existing table and enables active-only read policies", () => {
    expect(migration).toContain("ALTER TABLE public.products");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain('"Public can read active products"');
    expect(migration).toContain('"Runtime can read active products"');
    expect(migration).toContain("USING (is_active = true)");
    expect(migration).toContain("smc_payment_runtime");
  });

  it("removes API mutation grants and does not write or delete product rows", () => {
    expect(migration).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.products\n  FROM PUBLIC, anon, authenticated, service_role",
    );
    expect(migration).not.toMatch(/\bINSERT\s+INTO\s+public\.products\b/i);
    expect(migration).not.toMatch(/\bUPDATE\s+public\.products\b/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\s+public\.products\b/i);
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
  });
});
