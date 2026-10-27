"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormState } from "@/server/admin/action-state";
import {
  authenticateAdmin,
  clearLoginFailures,
  isLoginRateLimited,
  loginRateLimitKey,
  recordLoginFailure,
} from "@/server/admin/auth";
import { startAdminSession } from "@/server/admin/session";
import { fieldErrors, loginSchema, passwordValue, stringValue } from "@/server/admin/validation";

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    username: stringValue(formData.get("username")),
    password: passwordValue(formData.get("password")),
  });

  if (!parsed.success) {
    return { error: "Enter your username and password.", fieldErrors: fieldErrors(parsed.error) };
  }

  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  const key = loginRateLimitKey(parsed.data.username, ip);

  if (isLoginRateLimited(key)) {
    return { error: "Too many sign-in attempts. Try again in 15 minutes." };
  }

  const admin = await authenticateAdmin(parsed.data.username, parsed.data.password);
  if (!admin) {
    recordLoginFailure(key);
    return { error: "Incorrect username or password." };
  }

  clearLoginFailures(key);
  await startAdminSession({
    sub: admin.id,
    username: admin.username,
    name: admin.fullName,
    role: admin.role,
  });

  redirect(admin.mustChangePassword ? "/admin/account/" : "/admin/");
}
