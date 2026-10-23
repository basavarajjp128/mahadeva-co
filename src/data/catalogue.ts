import { products, type Product } from "@/data/products";
import { testProducts } from "@/data/test-products";

export type CatalogueEnvironment = Record<string, string | undefined>;

export function isTestCatalogueEnabled(environment?: CatalogueEnvironment): boolean {
  if (!environment) {
    if (process.env.NODE_ENV === "production") return false;
    return process.env.ENABLE_PAYMENT_TEST_DATA === "true";
  }
  return environment.NODE_ENV !== "production" && environment.ENABLE_PAYMENT_TEST_DATA === "true";
}

export function getCatalogueProducts(environment?: CatalogueEnvironment): Product[] {
  if (!environment) {
    if (process.env.NODE_ENV === "production") return products;
    if (process.env.ENABLE_PAYMENT_TEST_DATA !== "true") return products;
    return [...products, ...testProducts];
  }
  return isTestCatalogueEnabled(environment) ? [...products, ...testProducts] : products;
}

export function getTestProduct(slug: string, environment?: CatalogueEnvironment) {
  if (!isTestCatalogueEnabled(environment)) return undefined;
  return testProducts.find((product) => product.slug === slug);
}
