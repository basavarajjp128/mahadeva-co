import "server-only";

import { isTestCatalogueEnabled } from "@/data/catalogue";
import { testProducts } from "@/data/test-products";
import { getPrismaClient } from "@/server/prisma";
import type { Product, SupplyOption } from "@/types/product";
import type { Prisma, Product as DatabaseProduct } from "@/generated/prisma/client";

const fallbackImage = "/images/copra-stock.jpg";
const safeProductSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Optional merchandising columns (image_path, image_alt) are added by the
// product_images migration. Selecting them here keeps the storefront showing
// admin-managed images while falling back to the bundled copra photo.
const catalogueSelect = {
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
} satisfies Prisma.ProductSelect;

type CatalogueRow = Pick<
  DatabaseProduct,
  | "id"
  | "slug"
  | "displayName"
  | "description"
  | "category"
  | "categoryId"
  | "isActive"
  | "isSample"
  | "image"
  | "imageAlt"
>;

type TaxonomyCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  parentSlug: string | null;
};

type Taxonomy = {
  /**
   * False when the taxonomy tables cannot be read. Products are then shown
   * with their legacy category text instead of being hidden.
   */
  available: boolean;
  byId: Map<string, TaxonomyCategory>;
  bySlug: Map<string, TaxonomyCategory>;
  visibleCategoryIds: Set<string>;
  optionsByCategory: Map<string, SupplyOption[]>;
};

function emptyTaxonomy(): Taxonomy {
  return {
    available: false,
    byId: new Map(),
    bySlug: new Map(),
    visibleCategoryIds: new Set(),
    optionsByCategory: new Map(),
  };
}

/**
 * Loads the category tree and its supply options. Taxonomy is optional
 * merchandising data: if the tables are unavailable the shop still renders
 * products with their original category text instead of failing.
 */
async function loadTaxonomy(): Promise<Taxonomy> {
  const prisma = getPrismaClient();
  try {
    const [categories, options] = await Promise.all([
      prisma.productCategory.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          isActive: true,
          parent: { select: { name: true, slug: true, isActive: true } },
        },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      }),
      prisma.categoryOption.findMany({
        where: {
          isActive: true,
          category: { isActive: true },
          quantityUnit: { isActive: true },
          packagingType: { isActive: true },
        },
        select: {
          id: true,
          categoryId: true,
          defaultPackSize: true,
          minimumOrderQuantity: true,
          isDefault: true,
          quantityUnit: { select: { name: true, symbol: true, unitType: true } },
          packagingType: { select: { name: true, description: true } },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
    ]);

    const taxonomy = emptyTaxonomy();
    taxonomy.available = true;
    const all = new Map(categories.map((category) => [category.id, category]));

    function isVisible(id: string): boolean {
      const seen = new Set<string>();
      let current = all.get(id);
      while (current) {
        if (!current.isActive) return false;
        if (!current.parentId) return true;
        if (seen.has(current.parentId)) return false;
        seen.add(current.parentId);
        current = all.get(current.parentId);
      }
      // Orphaned categories are safer to hide than to guess a parent.
      return false;
    }

    for (const category of categories) {
      if (!isVisible(category.id)) continue;
      const parent = category.parent?.isActive ? category.parent : null;
      const entry: TaxonomyCategory = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        parentName: parent?.name ?? null,
        parentSlug: parent?.slug ?? null,
      };
      taxonomy.byId.set(entry.id, entry);
      taxonomy.bySlug.set(entry.slug, entry);
      taxonomy.visibleCategoryIds.add(entry.id);
    }

    for (const option of options) {
      const list = taxonomy.optionsByCategory.get(option.categoryId) ?? [];
      list.push({
        id: option.id,
        unitName: option.quantityUnit.name,
        unitSymbol: option.quantityUnit.symbol,
        unitType: option.quantityUnit.unitType,
        packagingName: option.packagingType.name,
        packagingDescription: option.packagingType.description,
        packSize: option.defaultPackSize?.toString() ?? null,
        minimumOrder: option.minimumOrderQuantity.toString(),
        isDefault: option.isDefault,
      });
      taxonomy.optionsByCategory.set(option.categoryId, list);
    }

    return taxonomy;
  } catch {
    return emptyTaxonomy();
  }
}

function resolveOptions(taxonomy: Taxonomy, category: TaxonomyCategory | null): SupplyOption[] {
  if (!category) return [];
  const direct = taxonomy.optionsByCategory.get(category.id);
  if (direct && direct.length > 0) return direct;
  if (category.parentId) return taxonomy.optionsByCategory.get(category.parentId) ?? [];
  return [];
}

function withTaxonomy(
  product: Product,
  row: CatalogueRow,
  taxonomy: Taxonomy,
): Product {
  const category =
    (row.categoryId ? taxonomy.byId.get(row.categoryId) : undefined) ??
    taxonomy.bySlug.get(row.category) ??
    null;

  return {
    ...product,
    categoryId: category?.id ?? row.categoryId ?? null,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    categoryParentName: category?.parentName ?? null,
    categoryParentSlug: category?.parentSlug ?? null,
    supplyOptions: resolveOptions(taxonomy, category),
  };
}

function toCatalogueProduct(row: CatalogueRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    description: row.description,
    category: row.category,
    isActive: row.isActive,
    isSample: row.isSample,
    image: row.image || fallbackImage,
    imageAlt: row.imageAlt || `${row.displayName} product image`,
    packagingInformation: null,
    enquiryAvailability: "whatsapp",
    price: null,
    priceCurrency: null,
    priceUnit: null,
    supportedSalesUnits: [],
    isDirectCheckoutEnabled: false,
  };
}

function localFixtures(): Product[] {
  return isTestCatalogueEnabled() ? testProducts : [];
}

function isVisibleProduct(row: CatalogueRow, taxonomy: Taxonomy): boolean {
  // Taxonomy is optional; without it every active product stays visible.
  if (!taxonomy.available || !row.categoryId) return true;
  return taxonomy.visibleCategoryIds.has(row.categoryId);
}

export async function getActiveProducts(): Promise<Product[]> {
  const [rows, taxonomy] = await Promise.all([
    getPrismaClient().product.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { displayName: "asc" }],
      select: catalogueSelect,
    }),
    loadTaxonomy(),
  ]);

  return rows
    .filter((row) => safeProductSlug.test(row.slug) && isVisibleProduct(row, taxonomy))
    .map((row) => withTaxonomy(toCatalogueProduct(row), row, taxonomy));
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  if (!safeProductSlug.test(slug)) return null;

  const [row, taxonomy] = await Promise.all([
    getPrismaClient().product.findFirst({
      where: { slug, isActive: true },
      select: catalogueSelect,
    }),
    loadTaxonomy(),
  ]);
  if (row && isVisibleProduct(row, taxonomy)) {
    return withTaxonomy(toCatalogueProduct(row), row, taxonomy);
  }
  return null;
}

/** Development payment fixtures stay server-only and never enter storefront queries. */
export async function getCheckoutProductBySlug(slug: string): Promise<Product | null> {
  const product = await getActiveProductBySlug(slug);
  if (product) return product;
  if (!safeProductSlug.test(slug)) return null;
  return localFixtures().find((fixture) => fixture.slug === slug) ?? null;
}
