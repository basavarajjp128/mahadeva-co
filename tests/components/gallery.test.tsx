import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GalleryPage from "@/app/(site)/gallery/page";
import { galleryItems } from "@/data/gallery";

describe("gallery page", () => {
  it("renders eight described subjects with supplied photos and explicit placeholders", () => {
    render(<GalleryPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "From Coconut Farms to Copra" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("figure")).toHaveLength(8);
    expect(screen.getAllByRole("img")).toHaveLength(8);
    expect(screen.getByText("Copra drying photo to be added")).toBeInTheDocument();
    expect(screen.getByText("Copra sacks photo to be added")).toBeInTheDocument();
    expect(screen.getByText("25 kg packaging photo to be added")).toBeInTheDocument();
    expect(screen.getByText("Wholesale dispatch photo to be added")).toBeInTheDocument();
  });

  it("keeps every supplied gallery image path present in public assets", () => {
    const suppliedImages = galleryItems.flatMap((item) => (item.image ? [item.image] : []));

    expect(suppliedImages).toHaveLength(4);
    for (const imagePath of suppliedImages) {
      expect(existsSync(join(process.cwd(), "public", imagePath.slice(1)))).toBe(true);
    }
  });

  it("provides keyboard-accessible full-size image links with descriptive alternatives", () => {
    render(<GalleryPage />);

    const firstImageLink = screen.getByRole("link", {
      name: "Open full-size image: Coconut plantation",
    });
    expect(firstImageLink).toHaveAttribute("href", "/images/gallery/coconut-plantation.avif");
    expect(firstImageLink).toHaveAttribute("target", "_blank");
    expect(within(firstImageLink).getByRole("img")).toHaveAttribute(
      "alt",
      "Aerial view across a lush coconut palm plantation.",
    );
  });
});
