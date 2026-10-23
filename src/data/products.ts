export type Product = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  image: string;
  imageAlt: string;
  packagingInformation: string | null;
  enquiryAvailability: "contact-not-configured" | "whatsapp";
  isSample: boolean;
  /** True only for entries in the opt-in local/test catalogue fixture. */
  isTestData?: boolean;
};

export const products: Product[] = [
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
