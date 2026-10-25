import type { Product } from "@/types/product";

export type { Product } from "@/types/product";

/** Sample data is retained only as an explicit Prisma seed input. */

export type SeedProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "displayName"
  | "description"
  | "image"
  | "imageAlt"
  | "packagingInformation"
  | "enquiryAvailability"
  | "isSample"
>;

export const products: SeedProduct[] = [
  {
    id: "sample-copra",
    slug: "copra",
    displayName: "Coconut copra",
    description:
      "Sample catalogue entry for coconut copra. Use an enquiry to discuss product details and wholesale requirements; specifications and terms must be confirmed directly.",
    image: "/images/copra-stock.jpg",
    imageAlt: "Close-up of light-brown dried coconuts in their fibrous shells",
    packagingInformation: null,
    enquiryAvailability: "contact-not-configured",
    isSample: true,
  },
];
