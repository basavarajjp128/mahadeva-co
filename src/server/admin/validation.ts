import { z } from "zod";
import {
  customerEnquiryStatuses,
  enquirySources,
  supplierEnquiryStatuses,
} from "@/server/admin/constants";

const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,39}$/;
const phonePattern = /^\+?[0-9][0-9\s\-()]{5,23}$/;

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use 128 characters or fewer.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Use 72 bytes or fewer (bcrypt ignores anything past 72 bytes).",
  );

export const usernameSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .regex(usernamePattern, "Use 3–40 lowercase letters, numbers, dots, dashes or underscores."),
  );

export const phoneSchema = z
  .string()
  .trim()
  .min(6, "Enter a phone number.")
  .max(24, "Use 24 characters or fewer.")
  .regex(phonePattern, "Use digits with an optional leading +.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "Enter 7–15 digits.");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the full name.")
  .max(120, "Use 120 characters or fewer.");

export const emailSchema = z
  .string()
  .trim()
  .max(254, "Use 254 characters or fewer.")
  .email("Enter a valid email address.");

function dateOfBirthError(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Use YYYY-MM-DD.";

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Enter a valid date.";

  const year = Number(match[1]);
  if (year < 1900 || year > 2100) return "Enter a year between 1900 and 2100.";

  const today = new Date();
  const age =
    today.getUTCFullYear() -
    date.getUTCFullYear() -
    (today.getUTCMonth() < date.getUTCMonth() ||
    (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate())
      ? 1
      : 0);

  if (age < 18) return "Admins must be at least 18 years old.";
  if (date.getTime() > today.getTime()) return "Date of birth cannot be in the future.";
  return null;
}

export const dateOfBirthSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const message = dateOfBirthError(value);
    if (message) ctx.addIssue({ code: "custom", message });
  })
  .optional()
  .or(z.literal("").transform(() => undefined));

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username.").max(60),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const setupSchema = z
  .object({
    fullName: fullNameSchema,
    username: usernameSchema,
    email: emailSchema,
    phone: phoneSchema,
    dateOfBirth: dateOfBirthSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const optionalDecimal = (options: { min: number; max: number; label: string }) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+(\.\d{1,3})?$/.test(value),
      `Enter a valid ${options.label}.`,
    )
    .refine(
      (value) => value === "" || (Number(value) >= options.min && Number(value) <= options.max),
      `Enter a ${options.label} between ${options.min} and ${options.max}.`,
    );

export const productUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the product name.")
    .max(160, "Use 160 characters or fewer."),
  slug: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(
      z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by single dashes."),
    ),
  category: z.string().trim().min(2, "Enter a category.").max(40, "Use 40 characters or fewer."),
  description: z.string().trim().max(5000, "Use 5,000 characters or fewer."),
  isActive: z.boolean(),
});

export const priceUpdateSchema = z.object({
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a price with up to 2 decimals.")
    .refine((value) => Number(value) > 0, "Price must be greater than zero.")
    .refine((value) => Number(value) <= 10_000_000, "Price is too large."),
});

export const purchaseRuleSchema = z
  .object({
    minQuantityKg: optionalDecimal({ min: 0.001, max: 1_000_000, label: "minimum quantity" }),
    directCheckoutMaxKg: optionalDecimal({ min: 0.002, max: 1_000_000, label: "maximum quantity" }),
    requiresEnquiryAbove: z.boolean(),
  })
  .refine(
    (data) =>
      !data.directCheckoutMaxKg ||
      !data.minQuantityKg ||
      Number(data.directCheckoutMaxKg) > Number(data.minQuantityKg),
    {
      path: ["directCheckoutMaxKg"],
      message: "Maximum quantity must be greater than the minimum quantity.",
    },
  );

export const gradeSchema = z.object({
  name: z.string().trim().min(1, "Enter a grade name.").max(60, "Use 60 characters or fewer."),
  description: z.string().trim().max(500, "Use 500 characters or fewer."),
});

export const inventorySchema = z.object({
  stockKg: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,3})?$/, "Enter stock in kg with up to 3 decimals.")
    .refine((value) => Number(value) <= 100_000_000, "Stock value is too large."),
  lowStockThresholdKg: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,3})?$/, "Enter a threshold in kg with up to 3 decimals.")
    .refine((value) => Number(value) <= 100_000_000, "Threshold is too large."),
});

export const customerEnquirySchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .or(z.literal("").transform(() => undefined))
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "Enter a valid email.",
    ),
  productId: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .refine((value) => !value || /^[0-9a-f-]{36}$/i.test(value), "Choose a valid product."),
  quantityKg: optionalDecimal({ min: 0.001, max: 100_000_000, label: "quantity" }),
  source: z.enum(enquirySources),
  message: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
});

export const customerEnquiryStatusSchema = z.object({
  id: z.string().uuid("Unknown enquiry."),
  status: z.enum(customerEnquiryStatuses),
});

export const supplierEnquiryStatusSchema = z.object({
  id: z.string().uuid("Unknown enquiry."),
  status: z.enum(supplierEnquiryStatuses),
});

export function checkboxValue(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export function stringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Passwords are used byte-for-byte; trimming would silently change them. */
export function passwordValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const output: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    output[key] ??= issue.message;
  }
  return output;
}
