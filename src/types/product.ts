export const productSalesUnits = ["KG", "QUINTAL", "METRIC_TON"] as const;

export type ProductSalesUnit = (typeof productSalesUnits)[number];

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
  isActive: boolean;
  price: string | null;
  priceCurrency: string | null;
  priceUnit: ProductSalesUnit | null;
  supportedSalesUnits: ProductSalesUnit[];
  isDirectCheckoutEnabled: boolean;
};
