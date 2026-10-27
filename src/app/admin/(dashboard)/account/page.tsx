import type { Metadata } from "next";
import { logoutAction } from "@/app/admin/(dashboard)/account/actions";
import { AdminAlert, AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/auth";
import { adminRoleLabels } from "@/server/admin/constants";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminAccountPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const error = first(params.error);

  return (
    <>
      <AdminPageHeader
        description="Your profile and sign-in credentials. Sessions expire automatically after eight hours."
        eyebrow="Account"
        title={admin.fullName}
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      <div className="admin-columns">
        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Profile</h2>
          </div>
          <dl className="admin-meta">
            <div>
              <dt>Username</dt>
              <dd>@{admin.username}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{adminRoleLabels[admin.role]}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{admin.email ?? "—"}</dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd>{admin.phone}</dd>
            </div>
          </dl>

          <div className="admin-form__actions">
            <form action={logoutAction}>
              <button className="admin-btn admin-btn--secondary" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Change password</h2>
          </div>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  );
}
