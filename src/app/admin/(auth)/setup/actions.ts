"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/server/admin/action-state";
import { bootstrapFirstAdmin, hasSupabaseAdminConfig } from "@/server/admin/auth";
import { startAdminSession } from "@/server/admin/session";
import { fieldErrors, passwordValue, setupSchema, stringValue } from "@/server/admin/validation";

export async function setupAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = setupSchema.safeParse({
    fullName: stringValue(formData.get("fullName")),
    username: stringValue(formData.get("username")),
    email: stringValue(formData.get("email")),
    phone: stringValue(formData.get("phone")),
    dateOfBirth: stringValue(formData.get("dateOfBirth")),
    password: passwordValue(formData.get("password")),
    confirmPassword: passwordValue(formData.get("confirmPassword")),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  if (!(await hasSupabaseAdminConfig())) {
    return {
      error:
        "Setup needs SUPABASE_URL and SUPABASE_SECRET_KEY in the server environment so the admin can be linked to a Supabase auth user.",
    };
  }

  const result = await bootstrapFirstAdmin({
    fullName: parsed.data.fullName,
    username: parsed.data.username,
    email: parsed.data.email,
    phone: parsed.data.phone,
    dateOfBirth: parsed.data.dateOfBirth,
    password: parsed.data.password,
  });

  if (!result.ok) return { error: result.error };

  await startAdminSession({
    sub: result.admin.id,
    username: result.admin.username,
    name: result.admin.fullName,
    role: result.admin.role,
  });

  redirect("/admin/");
}
