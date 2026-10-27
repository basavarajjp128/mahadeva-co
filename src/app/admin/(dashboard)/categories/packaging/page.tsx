import type { Metadata } from "next";
import Link from "next/link";
import {
  createPackagingAction,
  deletePackagingAction,
  updatePackagingAction,
} from "@/app/admin/(dashboard)/categories/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit";
import { AdminAlert, AdminEmpty, AdminField, AdminPageHeader } from "@/components/admin/ui";
import { canEdit, requireAdmin } from "@/server/admin/auth";
import { listPackagingTypes } from "@/server/admin/categories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Packaging types",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const savedMessages: Record<string, string> = {
  created: "Packaging type created.",
  updated: "Packaging type saved.",
  deleted: "Packaging type deleted.",
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminPackagingPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const writable = canEdit(admin.role);
  const params = await searchParams;
  const error = first(params.error);
  const saved = first(params.saved);
  const packaging = await listPackagingTypes();

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className="admin-btn admin-btn--ghost" href="/admin/categories/">
            ← Back to categories
          </Link>
        }
        description="Packaging types are combined with measurement units on a category to describe exactly how a product is supplied."
        eyebrow="Catalogue"
        title="Packaging types"
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
      {saved && savedMessages[saved] ? (
        <AdminAlert variant="success">{savedMessages[saved]}</AdminAlert>
      ) : null}

      <section className="admin-card">
        <div className="admin-card__head">
          <h2>Packaging</h2>
          <span className="admin-card__hint">
            {packaging.length} {packaging.length === 1 ? "type" : "types"}
          </span>
        </div>

        {packaging.length === 0 ? (
          <AdminEmpty description="Add the first packaging type below." title="No packaging yet" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Description</th>
                  <th scope="col">Reusable</th>
                  <th scope="col">Used in</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="admin-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {packaging.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="admin-table__primary">{item.name}</span>
                    </td>
                    <td>{item.description ?? "—"}</td>
                    <td>{item.isReusable ? "Yes" : "No"}</td>
                    <td>{item.optionCount}</td>
                    <td>
                      <span
                        className={`admin-badge admin-badge--${item.isActive ? "active" : "inactive"}`}
                      >
                        {item.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="admin-table__actions">
                      {writable ? (
                        <>
                          <details className="admin-details">
                            <summary className="admin-btn admin-btn--small">Edit</summary>
                            <form
                              action={updatePackagingAction.bind(null, item.id)}
                              className="admin-details__body admin-form"
                            >
                              <AdminField id={`name-${item.id}`} label="Name">
                                <input
                                  className="admin-input"
                                  defaultValue={item.name}
                                  id={`name-${item.id}`}
                                  maxLength={40}
                                  name="name"
                                  required
                                />
                              </AdminField>
                              <AdminField id={`description-${item.id}`} label="Description">
                                <textarea
                                  className="admin-textarea"
                                  defaultValue={item.description ?? ""}
                                  id={`description-${item.id}`}
                                  maxLength={300}
                                  name="description"
                                  rows={2}
                                />
                              </AdminField>
                              <div className="admin-option-grid">
                                <label className="admin-check" htmlFor={`reusable-${item.id}`}>
                                  <input
                                    defaultChecked={item.isReusable}
                                    id={`reusable-${item.id}`}
                                    name="isReusable"
                                    type="checkbox"
                                  />
                                  <span>
                                    <strong>Reusable</strong>
                                    <span>Packaging can be returned and reused.</span>
                                  </span>
                                </label>
                                <label className="admin-check" htmlFor={`active-${item.id}`}>
                                  <input
                                    defaultChecked={item.isActive}
                                    id={`active-${item.id}`}
                                    name="isActive"
                                    type="checkbox"
                                  />
                                  <span>
                                    <strong>Active</strong>
                                    <span>Hidden packaging cannot be selected for new options.</span>
                                  </span>
                                </label>
                              </div>
                              <div className="admin-form__actions">
                                <button
                                  className="admin-btn admin-btn--primary admin-btn--small"
                                  type="submit"
                                >
                                  Save packaging
                                </button>
                              </div>
                            </form>
                          </details>
                          <form action={deletePackagingAction.bind(null, item.id)}>
                            <ConfirmSubmitButton
                              message={`Delete the ${item.name} packaging type? Packaging used by category options cannot be deleted.`}
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {writable ? (
        <section className="admin-card admin-card--form">
          <div className="admin-card__head">
            <h2>New packaging type</h2>
          </div>
          <form action={createPackagingAction} className="admin-form">
            <AdminField id="new-name" label="Name">
              <input className="admin-input" id="new-name" maxLength={40} name="name" required />
            </AdminField>
            <AdminField id="new-description" label="Description">
              <textarea
                className="admin-textarea"
                id="new-description"
                maxLength={300}
                name="description"
                rows={3}
              />
            </AdminField>
            <div className="admin-option-grid">
              <label className="admin-check" htmlFor="new-reusable">
                <input id="new-reusable" name="isReusable" type="checkbox" />
                <span>
                  <strong>Reusable</strong>
                  <span>Packaging can be returned and reused.</span>
                </span>
              </label>
              <label className="admin-check" htmlFor="new-active">
                <input defaultChecked id="new-active" name="isActive" type="checkbox" />
                <span>
                  <strong>Active</strong>
                  <span>Active packaging can be selected for category options.</span>
                </span>
              </label>
            </div>
            <div className="admin-form__actions">
              <button className="admin-btn admin-btn--primary" type="submit">
                Create packaging type
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}
