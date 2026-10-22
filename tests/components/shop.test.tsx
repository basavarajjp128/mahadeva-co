import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ShopPage from "@/app/shop/page";
import { QuantityEnquiry } from "@/components/catalogue/quantity-enquiry";
import { products } from "@/data/products";

describe("shop page", () => {
  it("labels sample listings and links them to details without purchase language", () => {
    render(<ShopPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Copra for wholesale enquiries",
    );
    expect(screen.getByText("Sample listing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View details/ })).toHaveAttribute(
      "href",
      `/shop/${products[0].slug}/`,
    );
    expect(screen.getByText(/not offers for sale/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /buy|add to cart/i })).not.toBeInTheDocument();
  });

  it("converts an enquiry quantity and rejects zero in the form", () => {
    render(<QuantityEnquiry productName="Coconut copra" />);
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "quintal" } });
    expect(screen.getByText(/Equivalent: 100 kg · 1 quintal · 0.1 metric ton/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "0" } });
    expect(screen.getByRole("alert")).toHaveTextContent("greater than zero");
  });
});
