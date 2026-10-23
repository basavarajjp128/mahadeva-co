import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ShopPage from "@/app/shop/page";
import { QuantityEnquiry } from "@/components/catalogue/quantity-enquiry";
import { EnquiryWorkflow } from "@/components/enquiries/enquiry-workflow";
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
    render(<QuantityEnquiry productSlug="copra" />);
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "quintal" } });
    expect(screen.getByText(/Equivalent: 100 kg · 1 quintal · 0.1 metric ton/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "0" } });
    expect(screen.getByRole("alert")).toHaveTextContent("greater than zero");
  });

  it("validates an enquiry and opens the configured business WhatsApp conversation directly", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    render(<EnquiryWorkflow mode="bulk" />);
    const form = screen.getByRole("button", { name: "Enquire Now" }).closest("form");
    expect(form).not.toBeNull();
    const formScope = within(form as HTMLFormElement);
    fireEvent.click(screen.getByRole("button", { name: "Enquire Now" }));
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Enter an approximate quantity.")).toBeInTheDocument();

    fireEvent.change(formScope.getByLabelText("Name *", { exact: false }), {
      target: { value: "Asha Rao" },
    });
    fireEvent.change(formScope.getByLabelText("Email"), { target: { value: "asha@example.com" } });
    fireEvent.change(formScope.getByLabelText("Product *", { exact: false }), {
      target: { value: "copra" },
    });
    fireEvent.change(formScope.getByLabelText("Approximate quantity *", { exact: false }), {
      target: { value: "2" },
    });
    fireEvent.change(formScope.getByLabelText("Unit"), { target: { value: "quintal" } });
    fireEvent.change(formScope.getByLabelText("Delivery location (optional)"), {
      target: { value: "Mysuru" },
    });
    fireEvent.change(formScope.getByLabelText("Message *", { exact: false }), {
      target: { value: "Please share quotation details." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enquire Now" }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [openedUrl, target, features] = openSpy.mock.calls[0];
    expect(openedUrl).toMatch(/^https:\/\/wa\.me\/918971475042\?text=/);
    expect(target).toBe("_blank");
    expect(features).toContain("noopener");
    const message = new URL(openedUrl as string).searchParams.get("text") ?? "";
    expect(message).toContain("Quantity: 2 quintal");
    expect(message).toContain("Delivery location: Mysuru");
    expect(message).not.toContain("asha@example.com");
    expect(message).not.toContain("200 kg equivalent");
    expect(
      screen.getByText(/If WhatsApp opens, review your enquiry and press Send/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Business email is not configured yet/)).toBeInTheDocument();
    expect(form).not.toHaveAttribute("action");
    openSpy.mockRestore();
  });
});
