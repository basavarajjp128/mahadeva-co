import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const catalogueDb = vi.hoisted(() => ({
  product: { findMany: vi.fn(), findFirst: vi.fn() },
  productCategory: { findMany: vi.fn() },
  categoryOption: { findMany: vi.fn() },
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
  categoryId: null,
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
  beforeEach(() => {
    catalogueDb.product.findMany.mockReset();
    catalogueDb.product.findFirst.mockReset();
    catalogueDb.productCategory.findMany.mockReset().mockResolvedValue([]);
    catalogueDb.categoryOption.findMany.mockReset().mockResolvedValue([]);
  });

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
        categoryId: true,
        isActive: true,
        isSample: true,
        image: true,
        imageAlt: true,
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
        isSample: false,
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
        categoryId: true,
        isActive: true,
        isSample: true,
        image: true,
        imageAlt: true,
      },
    });
  });

  it("uses admin-managed image paths and alt text when present", async () => {
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "false");
    catalogueDb.product.findMany.mockResolvedValue([
      {
        ...databaseProduct,
        image: "/images/gallery/split-copra-coconuts.jpg",
        imageAlt: "Split copra coconuts drying in the sun",
      },
    ]);

    const [product] = await getActiveProducts();

    expect(product.image).toBe("/images/gallery/split-copra-coconuts.jpg");
    expect(product.imageAlt).toBe("Split copra coconuts drying in the sun");
  });

  it("rejects unsafe slugs and uses a local placeholder image", async () => {
    await expect(getActiveProductBySlug("../private")).resolves.toBeNull();
    expect(catalogueDb.product.findFirst).not.toHaveBeenCalled();

    catalogueDb.product.findMany.mockResolvedValue([databaseProduct]);
    const products = await getActiveProducts();
    expect(products.map((product) => product.image)).toEqual(["/images/copra-stock.jpg"]);
  });

  it("attaches the category tree and supply options, falling back to the parent category", async () => {
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "false");
    catalogueDb.product.findMany.mockResolvedValue([
      { ...databaseProduct, categoryId: "11111111-1111-4111-8111-111111111111" },
    ]);
    catalogueDb.productCategory.findMany.mockResolvedValue([
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Agricultural Products",
        slug: "agricultural-products",
        parentId: null,
        isActive: true,
        parent: null,
      },
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Coconut Copra",
        slug: "coconut-copra",
        parentId: "22222222-2222-4222-8222-222222222222",
        isActive: true,
        parent: {
          name: "Agricultural Products",
          slug: "agricultural-products",
          isActive: true,
        },
      },
    ]);
    catalogueDb.categoryOption.findMany.mockResolvedValue([
      {
        id: "option-1",
        categoryId: "22222222-2222-4222-8222-222222222222",
        defaultPackSize: "25.000",
        minimumOrderQuantity: "1.000",
        isDefault: true,
        quantityUnit: { name: "Kilogram", symbol: "kg", unitType: "weight" },
        packagingType: { name: "Sack", description: "Large agricultural commodity sack" },
      },
    ]);

    const [product] = await getActiveProducts();

    expect(product.categoryName).toBe("Coconut Copra");
    expect(product.categorySlug).toBe("coconut-copra");
    expect(product.categoryParentName).toBe("Agricultural Products");
    expect(product.categoryParentSlug).toBe("agricultural-products");
    expect(product.supplyOptions).toEqual([
      {
        id: "option-1",
        unitName: "Kilogram",
        unitSymbol: "kg",
        unitType: "weight",
        packagingName: "Sack",
        packagingDescription: "Large agricultural commodity sack",
        packSize: "25.000",
        minimumOrder: "1.000",
        isDefault: true,
      },
    ]);
  });

  it("hides products whose category has been deactivated", async () => {
    vi.stubEnv("ENABLE_PAYMENT_TEST_DATA", "false");
    const product = {
      ...databaseProduct,
      categoryId: "11111111-1111-4111-8111-111111111111",
    };
    catalogueDb.product.findMany.mockResolvedValue([product]);
    catalogueDb.product.findFirst.mockResolvedValue(product);
    catalogueDb.productCategory.findMany.mockResolvedValue([
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Agricultural Products",
        slug: "agricultural-products",
        parentId: null,
        isActive: true,
        parent: null,
      },
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Coconut Copra",
        slug: "coconut-copra",
        parentId: "22222222-2222-4222-8222-222222222222",
        isActive: false,
        parent: {
          name: "Agricultural Products",
          slug: "agricultural-products",
          isActive: true,
        },
      },
    ]);

    await expect(getActiveProducts()).resolves.toEqual([]);
    await expect(getActiveProductBySlug("copra")).resolves.toBeNull();
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
