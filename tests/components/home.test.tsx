import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("introduces the wholesale product focus without unverified claims", () => {
    render(<Home />);

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
