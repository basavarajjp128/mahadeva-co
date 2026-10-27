"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/admin/(dashboard)/account/actions";
import { AdminAlert, AdminField } from "@/components/admin/ui";
import { emptyFormState } from "@/server/admin/action-state";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, emptyFormState);

  return (
    <form action={formAction} className="admin-form">
      {state.error ? <AdminAlert variant="error">{state.error}</AdminAlert> : null}
      {state.success ? <AdminAlert variant="success">{state.success}</AdminAlert> : null}

      <AdminField
        error={state.fieldErrors?.currentPassword}
        id="currentPassword"
        label="Current password"
      >
        <input
          autoComplete="current-password"
          className="admin-input"
          id="currentPassword"
          name="currentPassword"
          required
          type="password"
        />
      </AdminField>

      <div className="admin-form__grid">
        <AdminField
          error={state.fieldErrors?.password}
          hint="At least 12 characters, up to 72 bytes."
          id="newPassword"
          label="New password"
        >
          <input
            autoComplete="new-password"
            className="admin-input"
            id="newPassword"
            name="password"
            required
            type="password"
          />
        </AdminField>

        <AdminField
          error={state.fieldErrors?.confirmPassword}
          id="confirmNewPassword"
          label="Confirm new password"
        >
          <input
            autoComplete="new-password"
            className="admin-input"
            id="confirmNewPassword"
            name="confirmPassword"
            required
            type="password"
          />
        </AdminField>
      </div>

      <div className="admin-form__actions">
        <button className="admin-btn admin-btn--primary" disabled={pending} type="submit">
          {pending ? "Updating…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
