export const productSalesUnits = ["KG", "QUINTAL", "METRIC_TON"] as const;

export type ProductSalesUnit = (typeof productSalesUnits)[number];

/** A category-defined unit + packaging combination shown on the storefront. */
export type SupplyOption = {
  id: string;
  unitName: string;
  unitSymbol: string;
  unitType: string;
  packagingName: string;
  packagingDescription: string | null;
  /** Decimal as a string, for example "25.000". */
  packSize: string | null;
  /** Decimal as a string, for example "1.000". */
  minimumOrder: string;
  isDefault: boolean;
};

/** Public, serializable product shape shared by server pages and client components. */
export type Product = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  image: string;
  imageAlt: string;
  packagingInformation: string | null;
  enquiryAvailability: "contact-not-configured" | "whatsapp";
  isSample: boolean;
  isTestData?: boolean;
  category: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  categoryParentName?: string | null;
  categoryParentSlug?: string | null;
  supplyOptions?: SupplyOption[];
  isActive: boolean;
  price: string | null;
  priceCurrency: string | null;
  priceUnit: ProductSalesUnit | null;
  supportedSalesUnits: ProductSalesUnit[];
  isDirectCheckoutEnabled: boolean;
};
