"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/server/admin/action-state";
import { changeOwnPassword, requireAdmin } from "@/server/admin/auth";
import { endAdminSession } from "@/server/admin/session";
import { changePasswordSchema, fieldErrors, passwordValue } from "@/server/admin/validation";

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: passwordValue(formData.get("currentPassword")),
    password: passwordValue(formData.get("password")),
    confirmPassword: passwordValue(formData.get("confirmPassword")),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const result = await changeOwnPassword(
    admin.id,
    parsed.data.currentPassword,
    parsed.data.password,
  );

  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/account");
  return { success: "Password updated." };
}

export async function logoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login/");
}
