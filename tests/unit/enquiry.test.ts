import { describe, expect, it } from "vitest";
import {
  buildMailtoHref,
  buildWhatsAppHref,
  contactDetails,
  getMailtoHref,
  getWhatsAppHref,
} from "@/config/contact";
import { buildContactHref, parseEnquiryContext } from "@/lib/enquiry-context";
import { buildWhatsAppEnquiryMessage } from "@/lib/enquiry-message";
import { validateEnquiry, type EnquiryValues } from "@/lib/enquiry-validation";
import { sampleProduct } from "../fixtures/product";

const emptyValues: EnquiryValues = {
  name: "",
  phone: "",
  email: "",
  message: "",
  productSlug: "",
  quantity: "",
  unit: "kg",
  deliveryLocation: "",
};

describe("WhatsApp and email enquiry links", () => {
  it("builds a wa.me URL from an international-format test fixture with encoded quotation text", () => {
    const message = buildWhatsAppEnquiryMessage({
      product: "Coconut copra & pieces",
      quantity: "12.5",
      unit: "quintal",
      deliveryLocation: "Bengaluru & nearby",
      name: "Asha Rao",
      message: "Please share price & packing details.",
    });
    const href = buildWhatsAppHref("+91 (98765) 43210", message);
    expect(href).not.toBeNull();

    const url = new URL(href ?? "");
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/919876543210");
    expect(url.searchParams.get("text")).toBe(message);
    expect(message).toContain("SRI MAHADEVA & CO");
    expect(message).toContain("Product: Coconut copra & pieces");
    expect(message).toContain("Quantity: 12.5 quintal");
    expect(message).toContain("Delivery location: Bengaluru & nearby");
    expect(message).toContain("Name: Asha Rao");
    expect(message).not.toContain("asha@example.com");
    expect(message).toContain("request a quotation");
  });

  it("omits unspecified fields and creates a fixed email fallback", () => {
    const defaultMessage = buildWhatsAppEnquiryMessage({ product: "" });
    expect(defaultMessage).not.toContain("Product:");
    expect(defaultMessage).not.toContain("Quantity:");
    expect(defaultMessage).not.toContain("Delivery location:");
    expect(getWhatsAppHref("")).toMatch(/^https:\/\/wa\.me\/918971475042$/);
    expect(getMailtoHref()).toBeNull();
    expect(buildWhatsAppHref(null, "hello")).toBeNull();
    expect(buildMailtoHref(null, "hello")).toBeNull();
  });

  it("formats a large kg quantity once and uses the configured owner number", () => {
    const message = buildWhatsAppEnquiryMessage({
      type: "Bulk enquiry",
      product: "Coconut copra",
      quantity: "15,000",
      unit: "kg",
      deliveryLocation: "Mysuru",
    });
    const href = getWhatsAppHref(message);
    const url = new URL(href ?? "");

    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/918971475042");
    expect(url.searchParams.get("text")).toContain("Quantity: 15,000 kg");
    expect(url.searchParams.get("text")).not.toContain("15,000 kg equivalent");
    expect(url.searchParams.get("text")).toContain("Delivery location: Mysuru");
  });

  it("encodes a fixed business email recipient, subject and enquiry body", () => {
    const href = buildMailtoHref("sales@example.test", "Need copra & details");
    expect(href).toContain("mailto:sales@example.test?");
    const url = new URL(href ?? "");
    expect(url.searchParams.get("subject")).toBe("Wholesale Copra Enquiry");
    expect(url.searchParams.get("body")).toBe("Need copra & details");
    const defaultEmail = new URL(buildMailtoHref("sales@example.test") ?? "");
    expect(defaultEmail.searchParams.get("subject")).toBe("Wholesale Copra Enquiry");
    expect(defaultEmail.searchParams.get("body")).toContain("SRI MAHADEVA & CO");
    expect(contactDetails.whatsappNumber).toBe("+91 8971475042");
    expect(getWhatsAppHref("Request a quotation")).toMatch(
      /^https:\/\/wa\.me\/918971475042\?text=/,
    );
    expect(contactDetails.email).toBeNull();
  });
});

describe("Contact Us query context", () => {
  it("builds a fixed Contact URL and validates supported product, quantity and location", () => {
    const href = buildContactHref({
      type: "product",
      productSlug: "copra",
      quantity: "2.5",
      unit: "metric ton",
      deliveryLocation: "Mysuru & district",
    });
    expect(href).toContain("/contact/?");
    const parsed = parseEnquiryContext(href.split("?")[1], [sampleProduct]);
    expect(parsed).toEqual({
      type: "product",
      productSlug: "copra",
      quantity: "2.5",
      unit: "metric ton",
      deliveryLocation: "Mysuru & district",
    });
  });

  it("drops unknown products, malformed quantities, unsupported units and excessive context", () => {
    expect(
      parseEnquiryContext(
        "?type=javascript%3Aalert(1)&product=%3Csvg%3E&quantity=Infinity&unit=ton&location=" +
          "x".repeat(121),
        [sampleProduct],
      ),
    ).toEqual({ type: "general" });
    expect(
      buildContactHref({
        type: "bulk",
        productSlug: "https://evil.example",
        quantity: "-1",
        unit: "kg",
      }),
    ).toBe("/contact/?type=bulk");
  });
});

describe("contact and bulk form validation", () => {
  it("rejects empty required values for contact and bulk enquiries", () => {
    const contactErrors = validateEnquiry(emptyValues, "contact", [sampleProduct]);
    expect(contactErrors.name).toBeTruthy();
    expect(contactErrors.email).toContain("either a phone number or an email");
    expect(contactErrors.message).toBeTruthy();
    expect(contactErrors.productSlug).toBeUndefined();
    expect(contactErrors.quantity).toBeUndefined();

    const bulkErrors = validateEnquiry(emptyValues, "bulk", [sampleProduct]);
    expect(bulkErrors.productSlug).toBeTruthy();
    expect(bulkErrors.quantity).toBe("Enter an approximate quantity.");
  });

  it("rejects malformed contact values, product selections, quantities and overlong input", () => {
    const errors = validateEnquiry(
      {
        ...emptyValues,
        name: "A".repeat(101),
        phone: "phone-me",
        email: "not-an-email",
        message: "x".repeat(2_001),
        productSlug: "unknown-product",
        quantity: "Infinity",
        deliveryLocation: "x".repeat(121),
      },
      "bulk",
      [sampleProduct],
    );
    expect(errors.name).toContain("100 characters");
    expect(errors.phone).toContain("valid phone number");
    expect(errors.email).toContain("valid email address");
    expect(errors.message).toContain("2,000 characters");
    expect(errors.productSlug).toContain("catalogue");
    expect(errors.quantity).toContain("up to three decimal places");
    expect(errors.deliveryLocation).toContain("120 characters");
  });

  it("accepts a valid enquiry with one contact method and a known catalogue product", () => {
    const errors = validateEnquiry(
      {
        ...emptyValues,
        name: "Asha Rao",
        email: "asha@example.com",
        message: "Please share a quotation.",
        productSlug: "copra",
        quantity: "2.5",
        unit: "metric ton",
      },
      "bulk",
      [sampleProduct],
    );
    expect(errors).toEqual({});
  });
});
