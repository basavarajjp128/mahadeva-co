export type CatalogueEnvironment = Record<string, string | undefined>;

export function isTestCatalogueEnabled(environment?: CatalogueEnvironment): boolean {
  if (!environment) {
    if (process.env.NODE_ENV === "production") return false;
    return process.env.ENABLE_PAYMENT_TEST_DATA === "true";
  }
  return environment.NODE_ENV !== "production" && environment.ENABLE_PAYMENT_TEST_DATA === "true";
}
