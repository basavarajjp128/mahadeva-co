"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/(auth)/login/actions";
import { AdminAlert, AdminField } from "@/components/admin/ui";
import { emptyFormState } from "@/server/admin/action-state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, emptyFormState);

  return (
    <form action={formAction} className="admin-form admin-login-form">
      {state.error ? <AdminAlert variant="error">{state.error}</AdminAlert> : null}

      <AdminField error={state.fieldErrors?.username} id="username" label="Username">
        <input
          autoComplete="username"
          autoCapitalize="none"
          className="admin-input"
          defaultValue=""
          id="username"
          name="username"
          required
          spellCheck={false}
          type="text"
        />
      </AdminField>

      <AdminField error={state.fieldErrors?.password} id="password" label="Password">
        <input
          autoComplete="current-password"
          className="admin-input"
          id="password"
          name="password"
          required
          type="password"
        />
      </AdminField>

      <button
        className="admin-btn admin-btn--primary admin-btn--block"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="admin-form__footnote">
        Trouble signing in? Ask the account owner to reset your password.
      </p>
    </form>
  );
}
