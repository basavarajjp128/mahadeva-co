import "server-only";

import { isTestCatalogueEnabled } from "@/data/catalogue";
import { testProducts } from "@/data/test-products";
import { getPrismaClient } from "@/server/prisma";
import type { Product } from "@/types/product";
import type { Prisma, Product as DatabaseProduct } from "@/generated/prisma/client";

const fallbackImage = "/images/copra-stock.jpg";
const safeProductSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// These are the columns in the existing products table. Keep the public
// catalogue readable before optional merchandising columns are migrated.
const catalogueSelect = {
  id: true,
  slug: true,
  displayName: true,
  description: true,
  category: true,
  isActive: true,
} satisfies Prisma.ProductSelect;

type CatalogueRow = Pick<
  DatabaseProduct,
  "id" | "slug" | "displayName" | "description" | "category" | "isActive"
>;

function toCatalogueProduct(row: CatalogueRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    description: row.description,
    category: row.category,
    isActive: row.isActive,
    isSample: true,
    image: fallbackImage,
    imageAlt: `${row.displayName} product image`,
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

export async function getActiveProducts(): Promise<Product[]> {
  const rows = await getPrismaClient().product.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { displayName: "asc" }],
    select: catalogueSelect,
  });
  return rows.filter((row) => safeProductSlug.test(row.slug)).map(toCatalogueProduct);
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  if (!safeProductSlug.test(slug)) return null;
  const row = await getPrismaClient().product.findFirst({
    where: { slug, isActive: true },
    select: catalogueSelect,
  });
  if (row) return toCatalogueProduct(row);
  return null;
}

/** Development payment fixtures stay server-only and never enter storefront queries. */
export async function getCheckoutProductBySlug(slug: string): Promise<Product | null> {
  const product = await getActiveProductBySlug(slug);
  if (product) return product;
  if (!safeProductSlug.test(slug)) return null;
  return localFixtures().find((fixture) => fixture.slug === slug) ?? null;
}
