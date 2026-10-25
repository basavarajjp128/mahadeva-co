import type { Product } from "@/types/product";
import { isQuantityUnit, validateQuantity, type QuantityUnit } from "@/lib/quantity";

export type EnquiryType = "general" | "product" | "bulk";

export type EnquiryContext = {
  type: EnquiryType;
  productSlug?: string;
  quantity?: string;
  unit?: QuantityUnit;
  deliveryLocation?: string;
};

const isEnquiryType = (value: string | null): value is EnquiryType =>
  value === "general" || value === "product" || value === "bulk";

export function parseEnquiryContext(search: string, catalogue: Product[] = []): EnquiryContext {
  if (search.length > 512) return { type: "general" };
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const rawType = params.get("type");
  const context: EnquiryContext = {
    type: isEnquiryType(rawType) ? rawType : "general",
  };

  const productSlug = params.get("product")?.trim();
  if (productSlug && catalogue.some((product) => product.slug === productSlug)) {
    context.productSlug = productSlug;
  }

  const quantity = params.get("quantity")?.trim();
  const unit = params.get("unit");
  if (
    quantity &&
    quantity.length <= 16 &&
    unit &&
    isQuantityUnit(unit) &&
    validateQuantity(quantity, unit).valid
  ) {
    context.quantity = quantity;
    context.unit = unit;
  }

  const deliveryLocation = params.get("location")?.trim();
  if (deliveryLocation && deliveryLocation.length <= 120) {
    context.deliveryLocation = deliveryLocation;
  }

  return context;
}

export function buildContactHref(context: Partial<EnquiryContext> = {}): string {
  const params = new URLSearchParams();
  const type = context.type ?? "general";
  params.set("type", type);

  const productSlug = context.productSlug;
  if (productSlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productSlug)) {
    params.set("product", productSlug);
  }

  const quantity = context.quantity?.trim();
  const unit = context.unit;
  if (
    quantity &&
    quantity.length <= 16 &&
    unit &&
    isQuantityUnit(unit) &&
    validateQuantity(quantity, unit).valid
  ) {
    params.set("quantity", quantity);
    params.set("unit", unit);
  }

  const location = context.deliveryLocation?.trim();
  if (location && location.length <= 120) params.set("location", location);

  return `/contact/?${params.toString()}`;
}

export function getEnquiryProduct(context: EnquiryContext, catalogue: Product[] = []) {
  return catalogue.find((product) => product.slug === context.productSlug);
}

export function formatEnquiryType(type: EnquiryType): string {
  switch (type) {
    case "bulk":
      return "Bulk order enquiry";
    case "product":
      return "Product enquiry";
    default:
      return "General enquiry";
  }
}
