import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentCheckout } from "@/components/catalogue/payment-checkout";

describe("payment checkout preview", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline"))));
  afterEach(() => vi.unstubAllGlobals());

  it("shows the checkout section while keeping sample payments disabled", () => {
    render(
      <PaymentCheckout enabled={false} productName="Dried Coconut Copra" productSlug="copra" />,
    );

    expect(screen.getByRole("heading", { name: "Online checkout" })).toBeInTheDocument();
    expect(screen.getByText(/disabled for this sample listing/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay securely · not enabled" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Request a quotation" })).toHaveAttribute(
      "href",
      "/contact/?type=product&product=copra",
    );
    expect(screen.queryByLabelText("Quantity")).not.toBeInTheDocument();
  });

  it("exposes test quantity presets and changes to quotation-only at 300 kg", () => {
    render(
      <PaymentCheckout
        enabled={false}
        isTestData
        priceCurrency="INR"
        pricePerKgMinor={3500}
        productName="Standard Dried Copra · TEST"
        productSlug="test-standard-dried-copra"
        testDirectCheckoutAllowed
      />,
    );

    expect(screen.getByText(/₹35\.00 per kg/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "25 kg" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5,000 kg" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "299 kg" }));
    expect(screen.getByLabelText("Quantity")).toHaveValue("299");
    expect(screen.getByRole("button", { name: "Test checkout not configured" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "300 kg" }));
    expect(screen.getByLabelText("Quantity")).toHaveValue("300");
    expect(screen.getByText(/300 kg or more must use the quotation flow/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pay securely/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a quotation" })).toHaveAttribute(
      "href",
      "/contact/?type=bulk&product=test-standard-dried-copra&quantity=300&unit=kg",
    );
  });

  it("keeps enquiry-only fixture products out of direct checkout regardless of quantity", () => {
    render(
      <PaymentCheckout
        enabled={false}
        isTestData
        priceCurrency="INR"
        pricePerKgMinor={3500}
        productName="Wholesale Copra · TEST"
        productSlug="test-wholesale-copra"
        testDirectCheckoutAllowed={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "25 kg" }));
    expect(screen.getByText(/configured for enquiries only/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pay securely/ })).not.toBeInTheDocument();
  });
});
