export type GalleryItem = {
  id: string;
  title: string;
  description: string;
  alt: string;
  image: string | null;
  placeholderLabel?: string;
};

// Replace null image paths with the corresponding owner-supplied photograph in
// public/images/gallery/. Captions describe subjects, not verified company operations.
export const galleryItems = [
  {
    id: "coconut-plantation",
    title: "Coconut plantation",
    description: "Rows of coconut palms across a green agricultural landscape.",
    alt: "Aerial view across a lush coconut palm plantation.",
    image: "/images/gallery/coconut-plantation.avif",
  },
  {
    id: "coconut-dehusking",
    title: "Coconut handling",
    description: "Workers among collected coconuts beneath the palms.",
    alt: "Workers handling coconuts beside a large collection beneath palm trees.",
    image: "/images/gallery/coconut-dehusking.jpeg",
  },
  {
    id: "harvested-coconuts",
    title: "Harvested coconuts",
    description: "Coconuts gathered together after harvest.",
    alt: "A group of harvested coconuts arranged on the ground.",
    image: "/images/gallery/harvested-coconuts.webp",
  },
  {
    id: "split-copra-coconuts",
    title: "Coconuts prepared for copra",
    description: "Mature coconuts split open to reveal the kernel.",
    alt: "Several mature coconuts split open, showing their white kernels.",
    image: "/images/gallery/split-copra-coconuts.jpg",
  },
  {
    id: "copra-drying",
    title: "Copra drying",
    description: "A place for a photograph of coconut pieces drying in an agricultural setting.",
    alt: "Placeholder for a photograph of copra drying.",
    image: null,
    placeholderLabel: "Copra drying photo to be added",
  },
  {
    id: "copra-sacks",
    title: "Copra in sacks",
    description: "A place for a photograph of copra stored in sacks.",
    alt: "Placeholder for a photograph of copra stored in sacks.",
    image: null,
    placeholderLabel: "Copra sacks photo to be added",
  },
  {
    id: "copra-packaging",
    title: "Copra packaging",
    description: "A place for a photograph of 25 kg copra packaging.",
    alt: "Placeholder for a photograph of 25 kilogram copra packaging.",
    image: null,
    placeholderLabel: "25 kg packaging photo to be added",
  },
  {
    id: "wholesale-dispatch",
    title: "Wholesale dispatch",
    description: "A place for a photograph of bulk copra sacks ready for dispatch.",
    alt: "Placeholder for a photograph of bulk copra sacks prepared for wholesale dispatch.",
    image: null,
    placeholderLabel: "Wholesale dispatch photo to be added",
  },
] satisfies GalleryItem[];
