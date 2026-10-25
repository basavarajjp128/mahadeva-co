import { z } from "zod";
import { formatQuantity, validateQuantity, type QuantityUnit } from "@/lib/quantity";

export const supplierQuantityUnits = ["kg", "quintal", "metric tonne"] as const;
export const copraGrades = ["Premium", "Standard", "Mixed", "Not Sure"] as const;

const fieldSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Enter your full name.")
      .max(100, "Use 100 characters or fewer."),
    mobile: z
      .string()
      .trim()
      .min(1, "Enter your mobile number.")
      .max(24, "Use 24 characters or fewer."),
    quantity: z
      .string()
      .trim()
      .min(1, "Enter the quantity of copra available.")
      .max(16, "Enter a shorter quantity."),
    unit: z.enum(supplierQuantityUnits, { error: "Choose kg, quintal or metric tonne." }),
    grade: z.enum(copraGrades, { error: "Choose a copra grade." }),
    villageDistrict: z
      .string()
      .trim()
      .min(1, "Enter your village or town and district.")
      .max(180, "Use 180 characters or fewer."),
    notes: z.string().trim().max(1_000, "Use 1,000 characters or fewer.").default(""),
    website: z.string().max(0, "Invalid submission.").optional().default(""),
  })
  .strict();

export type SupplierEnquiryDraft = z.input<typeof fieldSchema>;
export type SupplierEnquiryField = keyof SupplierEnquiryDraft;
export type SupplierEnquiryErrors = Partial<Record<SupplierEnquiryField, string>>;

export type ValidatedSupplierEnquiry = {
  fullName: string;
  mobile: string;
  quantity: number;
  unit: (typeof supplierQuantityUnits)[number];
  quantityKilograms: number;
  grade: (typeof copraGrades)[number];
  villageDistrict: string;
  notes: string;
};

function normalizeMobile(value: string): string | null {
  if (!/^\+?[0-9\s().-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

function validateSupplierQuantity(quantity: string, unit: SupplierEnquiryDraft["unit"]) {
  const quantityUnit: QuantityUnit = unit === "metric tonne" ? "metric ton" : unit;
  return validateQuantity(quantity, quantityUnit);
}

export function parseSupplierEnquiry(
  value: unknown,
):
  | { success: true; data: ValidatedSupplierEnquiry }
  | { success: false; errors: SupplierEnquiryErrors } {
  const parsed = fieldSchema.safeParse(value);
  if (!parsed.success) {
    const errors: SupplierEnquiryErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        typeof field === "string" &&
        field in fieldSchema.shape &&
        !errors[field as SupplierEnquiryField]
      ) {
        errors[field as SupplierEnquiryField] = issue.message;
      }
    }
    return { success: false, errors };
  }

  const mobile = normalizeMobile(parsed.data.mobile);
  if (!mobile) return { success: false, errors: { mobile: "Enter a valid Indian mobile number." } };

  const quantity = validateSupplierQuantity(parsed.data.quantity, parsed.data.unit);
  if (!quantity.valid) return { success: false, errors: { quantity: quantity.error } };

  return {
    success: true,
    data: {
      fullName: parsed.data.fullName,
      mobile,
      quantity: quantity.entered,
      unit: parsed.data.unit,
      quantityKilograms: quantity.kilograms,
      grade: parsed.data.grade,
      villageDistrict: parsed.data.villageDistrict,
      notes: parsed.data.notes,
    },
  };
}

export function formatSupplierQuantity(enquiry: ValidatedSupplierEnquiry): string {
  return `${formatQuantity(enquiry.quantity)} ${enquiry.unit}`;
}

export function buildSupplierWhatsAppMessage(enquiry: ValidatedSupplierEnquiry): string {
  const lines = [
    "Hello SRI MAHADEVA & CO, I would like to request a call back about selling copra.",
    `Farmer: ${enquiry.fullName}`,
    `Mobile: ${enquiry.mobile}`,
    `Available quantity: ${formatSupplierQuantity(enquiry)} (${formatQuantity(enquiry.quantityKilograms)} kg equivalent)`,
    `Grade: ${enquiry.grade}`,
    `Village/town and district: ${enquiry.villageDistrict}`,
  ];
  if (enquiry.notes) lines.push(`Additional notes: ${enquiry.notes}`);
  lines.push(
    "Please contact me to discuss assessment, price and pickup. I understand these are not confirmed until agreed separately.",
  );
  return lines.join("\n");
}
