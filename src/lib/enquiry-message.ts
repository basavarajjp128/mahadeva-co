import { brand } from "@/config/brand";
import type { QuantityUnit } from "@/lib/quantity";

export type EnquiryMessageDetails = {
  type?: string;
  product: string;
  quantity?: string;
  unit?: QuantityUnit | "Not specified";
  deliveryLocation?: string;
  name?: string;
  message?: string;
};

function singleLine(value: string | undefined, fallback: string): string {
  const normalized = value?.trim().replace(/[\r\n]+/g, " ");
  return normalized || fallback;
}

export function buildWhatsAppEnquiryMessage(details: EnquiryMessageDetails): string {
  const type = singleLine(details.type, "General enquiry");
  const product = singleLine(details.product, "General enquiry");
  const lines = [
    `Hello, I would like to request a quotation from ${brand.name}.`,
    `Enquiry type: ${type}`,
    ...(product === "General enquiry" ? [] : [`Product: ${product}`]),
    ...(details.quantity?.trim()
      ? [`Quantity: ${singleLine(details.quantity, "")}${details.unit ? ` ${details.unit}` : ""}`]
      : []),
    ...(details.deliveryLocation?.trim()
      ? [`Delivery location: ${singleLine(details.deliveryLocation, "")}`]
      : []),
    ...(details.name?.trim() ? [`Name: ${singleLine(details.name, "")}`] : []),
    ...(details.message?.trim() ? [`Message: ${singleLine(details.message, "")}`] : []),
    "Please confirm product details and terms directly. This enquiry is not an order.",
  ];

  return lines.join("\n");
}
