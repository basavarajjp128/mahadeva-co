import "server-only";

import { z } from "zod";

const serverPaymentEnvSchema = z.object({
  APP_DATABASE_URL: z
    .string()
    .min(1)
    .refine((value) => !value.includes("placeholder")),
  APP_ORIGIN: z
    .string()
    .url()
    .refine((value) => !value.includes("example.invalid")),
  RAZORPAY_KEY_ID: z.string().regex(/^rzp_test_[A-Za-z0-9]+$/),
  RAZORPAY_KEY_SECRET: z
    .string()
    .min(16)
    .refine((value) => !value.includes("replace_with")),
  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .min(16)
    .refine((value) => !value.includes("replace_with")),
  RATE_LIMIT_HMAC_SECRET: z
    .string()
    .min(32)
    .refine((value) => !value.includes("replace_with")),
});

export type ServerPaymentEnv = z.infer<typeof serverPaymentEnvSchema>;

export function readServerPaymentEnv(
  source: Record<string, string | undefined> = process.env,
): ServerPaymentEnv | null {
  const parsed = serverPaymentEnvSchema.safeParse(source);
  if (!parsed.success) return null;
  try {
    const databaseUrl = new URL(parsed.data.APP_DATABASE_URL);
    if (!(["postgres:", "postgresql:"].includes(databaseUrl.protocol) && databaseUrl.hostname)) {
      return null;
    }
    const appOrigin = new URL(parsed.data.APP_ORIGIN);
    if (appOrigin.hostname.endsWith(".invalid")) return null;
    const isLocalHttp =
      appOrigin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(appOrigin.hostname);
    if (appOrigin.protocol !== "https:" && !isLocalHttp) return null;
  } catch {
    return null;
  }
  return parsed.data;
}
