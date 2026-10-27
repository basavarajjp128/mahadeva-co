import type { Metadata } from "next";
import Link from "next/link";
import { createCategoryAction, deleteCategoryAction } from "@/app/admin/(dashboard)/categories/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit";
import { AdminAlert, AdminEmpty, AdminField, AdminPageHeader } from "@/components/admin/ui";
import { canEdit, requireAdmin } from "@/server/admin/auth";
import { listCategories } from "@/server/admin/categories";
import { formatDateTime } from "@/server/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const savedMessages: Record<string, string> = {
  created: "Category created.",
  deleted: "Category deleted.",
};

export default async function AdminCategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const writable = canEdit(admin.role);
  const params = await searchParams;
  const error = first(params.error);
  const saved = first(params.saved);
  const categories = await listCategories();

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Link className="admin-btn admin-btn--secondary" href="/admin/categories/units/">
              Measurement units
            </Link>
            <Link className="admin-btn admin-btn--secondary" href="/admin/categories/packaging/">
              Packaging types
            </Link>
          </>
        }
        description="Build the catalogue taxonomy. A category controls the quantity units and packaging options shown for its products in the shop."
        eyebrow="Catalogue"
        title="Categories"
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
      {saved && savedMessages[saved] ? (
        <AdminAlert variant="success">{savedMessages[saved]}</AdminAlert>
      ) : null}

      <div className="admin-columns admin-columns--wide-left">
        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Category tree</h2>
            <span className="admin-card__hint">
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </span>
          </div>

          {categories.length === 0 ? (
            <AdminEmpty
              description="Create the first category with the form on this page."
              title="No categories yet"
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Parent</th>
                    <th scope="col">Products</th>
                    <th scope="col">Options</th>
                    <th scope="col">Status</th>
                    <th scope="col">Order</th>
                    <th scope="col">Updated</th>
                    <th scope="col">
                      <span className="admin-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <span
                          className={
                            category.parentId ? "admin-table__primary admin-tree-child" : "admin-table__primary"
                          }
                        >
                          {category.name}
                        </span>
                        <span className="admin-table__sub">/{category.slug}</span>
                      </td>
                      <td>{category.parentName ?? "Top level"}</td>
                      <td>{category.productCount}</td>
                      <td>{category.optionCount}</td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${category.isActive ? "active" : "inactive"}`}
                        >
                          {category.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td>{category.displayOrder}</td>
                      <td className="admin-table__time">{formatDateTime(category.updatedAt)}</td>
                      <td className="admin-table__actions">
                        <Link
                          className="admin-btn admin-btn--small"
                          href={`/admin/categories/${category.id}/`}
                        >
                          Edit
                        </Link>
                        {writable ? (
                          <form action={deleteCategoryAction.bind(null, category.id)}>
                            <ConfirmSubmitButton
                              message={`Delete “${category.name}”? This cannot be undone.`}
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
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
          <section className="admin-card">
            <div className="admin-card__head">
              <h2>New category</h2>
            </div>
            <form action={createCategoryAction} className="admin-form">
              <AdminField id="name" label="Name">
                <input className="admin-input" id="name" maxLength={80} name="name" required />
              </AdminField>

              <AdminField
                hint="Leave blank to generate it from the name."
                id="slug"
                label="URL slug"
              >
                <input
                  className="admin-input"
                  id="slug"
                  maxLength={80}
                  name="slug"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  placeholder="coconut-copra"
                  spellCheck={false}
                />
              </AdminField>

              <AdminField
                hint="Leave as top level for a main category."
                id="parentId"
                label="Parent category"
              >
                <select className="admin-input" defaultValue="" id="parentId" name="parentId">
                  <option value="">Top level</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.parentName
                        ? `${category.parentName} › ${category.name}`
                        : category.name}
                    </option>
                  ))}
                </select>
              </AdminField>

              <AdminField id="description" label="Description">
                <textarea
                  className="admin-textarea"
                  id="description"
                  maxLength={500}
                  name="description"
                  rows={3}
                />
              </AdminField>

              <AdminField
                hint="Optional /path from public or an https:// image URL."
                id="imageUrl"
                label="Image path or URL"
              >
                <input
                  className="admin-input"
                  id="imageUrl"
                  maxLength={2048}
                  name="imageUrl"
                  placeholder="/images/copra-stock.jpg"
                  spellCheck={false}
                />
              </AdminField>

              <div className="admin-form__grid">
                <AdminField hint="Lower numbers appear first." id="displayOrder" label="Display order">
                  <input
                    className="admin-input"
                    defaultValue="0"
                    id="displayOrder"
                    inputMode="numeric"
                    maxLength={4}
                    name="displayOrder"
                    pattern="[0-9]{1,4}"
                  />
                </AdminField>
                <div className="admin-field admin-field--check">
                  <label className="admin-check" htmlFor="isActive">
                    <input defaultChecked id="isActive" name="isActive" type="checkbox" />
                    <span>
                      <strong>Active</strong>
                      <span>Hidden categories and their products leave the public shop.</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="admin-form__actions">
                <button className="admin-btn admin-btn--primary" type="submit">
                  Create category
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </>
  );
}
