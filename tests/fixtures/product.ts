import type { Product } from "@/types/product";

export const sampleProduct: Product = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "copra",
  displayName: "Coconut copra",
  description: "Sample copra listing used by tests.",
  image: "/images/copra-stock.jpg",
  imageAlt: "Dried coconuts",
  packagingInformation: null,
  enquiryAvailability: "whatsapp",
  isSample: true,
  category: "copra",
  isActive: true,
  price: null,
  priceCurrency: null,
  priceUnit: null,
  supportedSalesUnits: [],
  isDirectCheckoutEnabled: false,
};
