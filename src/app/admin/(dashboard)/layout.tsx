import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/(dashboard)/account/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminAlert } from "@/components/admin/ui";
import { brand } from "@/config/brand";
import { canEdit, requireAdmin } from "@/server/admin/auth";
import { adminRoleLabels } from "@/server/admin/constants";
import { initials } from "@/server/admin/format";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const writable = canEdit(admin.role);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin/">
          <span aria-hidden="true" className="admin-brand__mark">
            {initials(brand.name)}
          </span>
          <span>
            <span className="admin-brand__name">{brand.name}</span>
            <span className="admin-brand__label">Admin workspace</span>
          </span>
        </Link>

        <AdminNav />

        <div className="admin-sidebar__foot">
          <div className="admin-user">
            <span aria-hidden="true" className="admin-user__avatar">
              {initials(admin.fullName)}
            </span>
            <span>
              <span className="admin-user__name">{admin.fullName}</span>
              <span className="admin-user__meta">
                @{admin.username} · {adminRoleLabels[admin.role]}
              </span>
            </span>
          </div>
          <Link className="admin-sidebar__link" href="/admin/account/">
            Account settings
          </Link>
          <form action={logoutAction}>
            <button className="admin-btn admin-btn--sidebar" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <p className="admin-topbar__title">{brand.name} admin</p>
          <div className="admin-topbar__actions">
            <a className="admin-topbar__link" href="/" rel="noreferrer" target="_blank">
              View website ↗
            </a>
            <span className={`admin-role admin-role--${admin.role}`}>
              {adminRoleLabels[admin.role]}
            </span>
          </div>
        </header>

        <main className="admin-content">
          {writable ? null : (
            <AdminAlert variant="warning">
              Your account has read-only access. Ask an owner or admin to change your role before
              editing records.
            </AdminAlert>
          )}

          {admin.mustChangePassword ? (
            <AdminAlert variant="warning">
              You are using a temporary password. <Link href="/admin/account/">Change it now</Link>.
            </AdminAlert>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
}
