import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
const { homeProduct } = vi.hoisted(() => ({
  homeProduct: {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "copra",
    displayName: "Coconut copra",
    description: "Sample copra product for the home page test.",
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
  },
}));

vi.mock("@/server/catalogue", () => ({
  getActiveProducts: async () => [homeProduct],
}));

describe("home page", () => {
  it("introduces the wholesale product focus without unverified claims", async () => {
    render(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Coconut copra for wholesale trade.",
    );
    expect(screen.getByRole("link", { name: /Explore Products/ })).toHaveAttribute(
      "href",
      "#product",
    );
    expect(screen.getByRole("link", { name: /Explore all products/ })).toHaveAttribute(
      "href",
      "/shop/",
    );
    expect(
      document.querySelectorAll(".home-products__card .product-card").length,
    ).toBeLessThanOrEqual(2);
    expect(
      screen.getByRole("heading", { name: "Agree the details before you proceed." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Aerial view of a dense coconut palm plantation." }),
    ).toHaveAttribute("src", expect.stringContaining("coconut-farm.jpg"));
  });
});
