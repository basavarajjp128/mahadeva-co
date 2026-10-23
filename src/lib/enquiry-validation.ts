import { products, type Product } from "@/data/products";
import { isQuantityUnit, validateQuantity } from "@/lib/quantity";

export type EnquiryMode = "contact" | "bulk";

export type EnquiryValues = {
  name: string;
  phone: string;
  email: string;
  message: string;
  productSlug: string;
  quantity: string;
  unit: string;
  deliveryLocation: string;
};

export type EnquiryField = keyof EnquiryValues;
export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

export function validateEnquiry(
  values: EnquiryValues,
  mode: EnquiryMode,
  catalogue: Product[] = products,
): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const name = values.name.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();
  const message = values.message.trim();
  const quantity = values.quantity.trim();
  const location = values.deliveryLocation.trim();

  if (!name) errors.name = "Enter your name.";
  else if (name.length > 100) errors.name = "Name must be 100 characters or fewer.";

  if (phone.length > 24) errors.phone = "Phone number must be 24 characters or fewer.";
  else if (
    phone &&
    (!/^\+?[0-9\s().-]{8,24}$/.test(phone) || !/^\d{8,15}$/.test(phone.replace(/\D/g, "")))
  ) {
    errors.phone = "Enter a valid phone number with 8 to 15 digits.";
  }

  if (email.length > 254) errors.email = "Email must be 254 characters or fewer.";
  else if (email && !/^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!phone && !email) errors.email = "Enter either a phone number or an email address.";

  if (!message) errors.message = "Enter a message for your enquiry.";
  else if (message.length > 2_000) errors.message = "Message must be 2,000 characters or fewer.";

  if (mode === "bulk" && !values.productSlug) {
    errors.productSlug = "Choose a product for your bulk enquiry.";
  } else if (
    values.productSlug &&
    !catalogue.some((product) => product.slug === values.productSlug)
  ) {
    errors.productSlug = "Choose a product from the catalogue.";
  }

  if (mode === "bulk" && !quantity) {
    errors.quantity = "Enter an approximate quantity.";
  } else if (quantity) {
    const result = validateQuantity(quantity, values.unit);
    if (!result.valid) errors.quantity = result.error;
  }

  if (!isQuantityUnit(values.unit)) errors.unit = "Choose kg, quintal or metric ton.";
  if (location.length > 120) {
    errors.deliveryLocation = "Delivery location must be 120 characters or fewer.";
  }

  return errors;
}
