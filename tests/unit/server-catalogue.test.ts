import { afterEach, describe, expect, it, vi } from "vitest";

const catalogueDb = vi.hoisted(() => ({
  product: { findMany: vi.fn(), findFirst: vi.fn() },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma", () => ({ getPrismaClient: () => catalogueDb }));

import {
  getActiveProductBySlug,
  getActiveProducts,
  getCheckoutProductBySlug,
} from "@/server/catalogue";

const databaseProduct = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "copra",
  displayName: "Coconut copra",
  description: null,
  category: "copra",
  isActive: true,
  isSample: false,
  price: null,
  priceCurrency: null,
  priceUnit: null,
  supportedSalesUnits: [],
  image: null,
  imageAlt: null,
  packagingInformation: null,
  isDirectCheckoutEnabled: false,
};

describe("server catalogue queries", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("queries active products on the server and maps database fields safely", async () => {
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "false");
    catalogueDb.product.findMany.mockResolvedValue([databaseProduct]);

    const products = await getActiveProducts();

    expect(catalogueDb.product.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { displayName: "asc" }],
      select: {
        id: true,
        slug: true,
        displayName: true,
        description: true,
        category: true,
        isActive: true,
      },
    });
    expect(products).toEqual([
      expect.objectContaining({
        id: databaseProduct.id,
        displayName: "Coconut copra",
        image: "/images/copra-stock.jpg",
        imageAlt: "Coconut copra product image",
        price: null,
        isActive: true,
      }),
    ]);
  });

  it("looks up only an active slug and returns null for missing or inactive listings", async () => {
    catalogueDb.product.findFirst.mockResolvedValue(null);
    await expect(getActiveProductBySlug("unavailable-product")).resolves.toBeNull();
    expect(catalogueDb.product.findFirst).toHaveBeenCalledWith({
      where: { slug: "unavailable-product", isActive: true },
      select: {
        id: true,
        slug: true,
        displayName: true,
        description: true,
        category: true,
        isActive: true,
      },
    });
  });

  it("rejects unsafe slugs and uses a local placeholder image", async () => {
    await expect(getActiveProductBySlug("../private")).resolves.toBeNull();
    expect(catalogueDb.product.findFirst).not.toHaveBeenCalled();

    catalogueDb.product.findMany.mockResolvedValue([databaseProduct]);
    const products = await getActiveProducts();
    expect(products.map((product) => product.image)).toEqual(["/images/copra-stock.jpg"]);
  });

  it("keeps development fixtures out of storefront results but available to the payment test path", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "true");
    catalogueDb.product.findMany.mockResolvedValue([databaseProduct]);
    const products = await getActiveProducts();

    expect(products).toHaveLength(1);
    expect(products.map((product) => product.slug)).toEqual(["copra"]);
    catalogueDb.product.findFirst.mockResolvedValue(null);
    await expect(getActiveProductBySlug("test-standard-dried-copra")).resolves.toBeNull();
    await expect(getCheckoutProductBySlug("test-standard-dried-copra")).resolves.toMatchObject({
      isTestData: true,
    });

    vi.stubEnv("NODE_ENV", "production");
    await expect(getCheckoutProductBySlug("test-standard-dried-copra")).resolves.toBeNull();
  });
});
