export type Product = {
  slug: string;
  name: string;
  category: string;
  description: string;
  image: string;
  imageAlt: string;
  enquiryLabel: string;
};

export const products: Product[] = [
  {
    slug: "copra",
    name: "Coconut copra",
    category: "Wholesale enquiry",
    description:
      "Share your grade and volume requirements to begin a conversation about wholesale supply.",
    image: "/images/copra-editorial.svg",
    imageAlt: "Editorial illustration of coconuts and dried coconut copra pieces",
    enquiryLabel: "Enquire about copra",
  },
];
