"use client";

import { useActionState } from "react";
import { setupAction } from "@/app/admin/(auth)/setup/actions";
import { AdminAlert, AdminField } from "@/components/admin/ui";
import { emptyFormState } from "@/server/admin/action-state";

export function SetupForm() {
  const [state, formAction, pending] = useActionState(setupAction, emptyFormState);

  return (
    <form action={formAction} className="admin-form">
      {state.error ? <AdminAlert variant="error">{state.error}</AdminAlert> : null}

      <div className="admin-form__grid">
        <AdminField error={state.fieldErrors?.fullName} id="fullName" label="Full name">
          <input
            autoComplete="name"
            className="admin-input"
            id="fullName"
            name="fullName"
            required
            type="text"
          />
        </AdminField>

        <AdminField
          error={state.fieldErrors?.username}
          hint="Lowercase letters, numbers, dots, dashes or underscores."
          id="username"
          label="Username"
        >
          <input
            autoCapitalize="none"
            autoComplete="username"
            className="admin-input"
            id="username"
            name="username"
            required
            spellCheck={false}
            type="text"
          />
        </AdminField>

        <AdminField error={state.fieldErrors?.email} id="email" label="Email">
          <input
            autoComplete="email"
            className="admin-input"
            id="email"
            name="email"
            required
            type="email"
          />
        </AdminField>

        <AdminField error={state.fieldErrors?.phone} id="phone" label="Mobile number">
          <input
            autoComplete="tel"
            className="admin-input"
            id="phone"
            inputMode="tel"
            name="phone"
            placeholder="+91 98765 43210"
            required
            type="tel"
          />
        </AdminField>

        <AdminField
          error={state.fieldErrors?.dateOfBirth}
          hint="Optional. Used only for account records."
          id="dateOfBirth"
          label="Date of birth"
        >
          <input
            autoComplete="bday"
            className="admin-input"
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
          />
        </AdminField>
      </div>

      <div className="admin-form__grid">
        <AdminField
          error={state.fieldErrors?.password}
          hint="At least 12 characters (72 bytes maximum)."
          id="password"
          label="Password"
        >
          <input
            autoComplete="new-password"
            className="admin-input"
            id="password"
            name="password"
            required
            type="password"
          />
        </AdminField>

        <AdminField
          error={state.fieldErrors?.confirmPassword}
          id="confirmPassword"
          label="Confirm password"
        >
          <input
            autoComplete="new-password"
            className="admin-input"
            id="confirmPassword"
            name="confirmPassword"
            required
            type="password"
          />
        </AdminField>
      </div>

      <button className="admin-btn admin-btn--primary" disabled={pending} type="submit">
        {pending ? "Creating account…" : "Create owner account"}
      </button>
    </form>
  );
}
