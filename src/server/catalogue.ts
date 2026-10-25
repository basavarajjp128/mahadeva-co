import "server-only";

import { isTestCatalogueEnabled } from "@/data/catalogue";
import { testProducts } from "@/data/test-products";
import { getPrismaClient } from "@/server/prisma";
import type { Product } from "@/types/product";

const fallbackImage = "/images/copra-stock.jpg";
const safeProductSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function safeImagePath(value: string | null): string {
  if (!value?.startsWith("/images/") || value.startsWith("//")) return fallbackImage;
  if (value.includes("\\") || value.split("/").some((part) => part === "..")) {
    return fallbackImage;
  }
  return value;
}

function toCatalogueProduct(row: {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  category: string;
  isActive: boolean;
  isSample: boolean;
  price: { toString(): string } | null;
  priceCurrency: string | null;
  priceUnit: Product["priceUnit"];
  supportedSalesUnits: Product["supportedSalesUnits"];
  image: string | null;
  imageAlt: string | null;
  packagingInformation: string | null;
  isDirectCheckoutEnabled: boolean;
}): Product {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    description: row.description,
    category: row.category,
    isActive: row.isActive,
    isSample: row.isSample,
    image: safeImagePath(row.image),
    imageAlt: row.imageAlt || `${row.displayName} product image`,
    packagingInformation: row.packagingInformation,
    enquiryAvailability: "whatsapp",
    price: row.price?.toString() ?? null,
    priceCurrency: row.priceCurrency?.trim() ?? null,
    priceUnit: row.priceUnit,
    supportedSalesUnits: row.supportedSalesUnits,
    isDirectCheckoutEnabled: row.isDirectCheckoutEnabled,
  };
}

function localFixtures(): Product[] {
  return isTestCatalogueEnabled() ? testProducts : [];
}

export async function getActiveProducts(): Promise<Product[]> {
  const rows = await getPrismaClient().product.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { displayName: "asc" }],
  });
  return [
    ...rows.filter((row) => safeProductSlug.test(row.slug)).map(toCatalogueProduct),
    ...localFixtures(),
  ];
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  if (!safeProductSlug.test(slug)) return null;
  const row = await getPrismaClient().product.findFirst({
    where: { slug, isActive: true },
  });
  if (row) return toCatalogueProduct(row);
  return localFixtures().find((product) => product.slug === slug) ?? null;
}
