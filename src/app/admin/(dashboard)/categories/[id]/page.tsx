import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCategoryOptionAction,
  deleteCategoryAction,
  deleteCategoryOptionAction,
  updateCategoryAction,
  updateCategoryOptionAction,
} from "@/app/admin/(dashboard)/categories/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit";
import { AdminAlert, AdminEmpty, AdminField, AdminPageHeader } from "@/components/admin/ui";
import { canEdit, requireAdmin } from "@/server/admin/auth";
import {
  getCategory,
  listCategories,
  listCategoryOptions,
  listPackagingTypes,
  listUnits,
} from "@/server/admin/categories";
import { formatNumber } from "@/server/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit category",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const savedMessages: Record<string, string> = {
  category: "Category saved.",
  options: "Supply options saved.",
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function unitLabel(option: {
  unitName: string;
  unitSymbol: string;
  defaultPackSize: string | null;
}): string {
  return option.defaultPackSize
    ? `${formatNumber(Number(option.defaultPackSize))} ${option.unitSymbol}`
    : option.unitSymbol;
}

export default async function AdminCategoryPage({ params, searchParams }: PageProps) {
  const admin = await requireAdmin();
  const writable = canEdit(admin.role);
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const category = await getCategory(id);
  if (!category) notFound();

  const [categories, options, units, packaging] = await Promise.all([
    listCategories(),
    listCategoryOptions(id),
    listUnits(),
    listPackagingTypes(),
  ]);
  const query = await searchParams;
  const error = first(query.error);
  const saved = first(query.saved);

  const activeUnits = units.filter((unit) => unit.isActive);
  const activePackaging = packaging.filter((item) => item.isActive);

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Link className="admin-btn admin-btn--ghost" href="/admin/categories/">
              ← Back to categories
            </Link>
            <Link className="admin-btn admin-btn--secondary" href="/shop/" target="_blank">
              View shop ↗
            </Link>
          </>
        }
        description={`/${category.slug} · ${category.parentName ? `${category.parentName} › ` : ""}${category.parentName ? category.name : "Top-level category"}`}
        eyebrow="Catalogue"
        title={category.name}
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
      {saved && savedMessages[saved] ? (
        <AdminAlert variant="success">{savedMessages[saved]}</AdminAlert>
      ) : null}

      <div className="admin-columns admin-columns--wide-left">
        <div className="admin-stack">
          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Category details</h2>
              <span className="admin-card__hint">
                {category.productCount} products · {category.optionCount} options
              </span>
            </div>

            {writable ? (
              <form action={updateCategoryAction.bind(null, category.id)} className="admin-form">
                <div className="admin-form__grid">
                  <AdminField id="name" label="Name">
                    <input
                      className="admin-input"
                      defaultValue={category.name}
                      id="name"
                      maxLength={80}
                      name="name"
                      required
                    />
                  </AdminField>
                  <AdminField
                    hint="Used in /shop/?category=… filters."
                    id="slug"
                    label="URL slug"
                  >
                    <input
                      className="admin-input"
                      defaultValue={category.slug}
                      id="slug"
                      maxLength={80}
                      name="slug"
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      required
                      spellCheck={false}
                    />
                  </AdminField>
                </div>

                <AdminField
                  hint="A category cannot sit inside one of its own subcategories."
                  id="parentId"
                  label="Parent category"
                >
                  <select
                    className="admin-input"
                    defaultValue={category.parentId ?? ""}
                    id="parentId"
                    name="parentId"
                  >
                    <option value="">Top level</option>
                    {categories
                      .filter((item) => item.id !== category.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.parentName ? `${item.parentName} › ${item.name}` : item.name}
                        </option>
                      ))}
                  </select>
                </AdminField>

                <AdminField id="description" label="Description">
                  <textarea
                    className="admin-textarea"
                    defaultValue={category.description ?? ""}
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
                    defaultValue={category.imageUrl ?? ""}
                    id="imageUrl"
                    maxLength={2048}
                    name="imageUrl"
                    placeholder="/images/copra-stock.jpg"
                    spellCheck={false}
                  />
                </AdminField>

                <div className="admin-form__grid">
                  <AdminField
                    hint="Lower numbers appear first."
                    id="displayOrder"
                    label="Display order"
                  >
                    <input
                      className="admin-input"
                      defaultValue={category.displayOrder}
                      id="displayOrder"
                      inputMode="numeric"
                      maxLength={4}
                      name="displayOrder"
                      pattern="[0-9]{1,4}"
                    />
                  </AdminField>
                  <div className="admin-field admin-field--check">
                    <label className="admin-check" htmlFor="isActive">
                      <input
                        defaultChecked={category.isActive}
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                      />
                      <span>
                        <strong>Active</strong>
                        <span>Hidden categories and their products leave the public shop.</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="admin-form__actions">
                  <button className="admin-btn admin-btn--primary" type="submit">
                    Save category
                  </button>
                </div>
              </form>
            ) : (
              <dl className="admin-facts">
                <div>
                  <dt>Slug</dt>
                  <dd>/{category.slug}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{category.isActive ? "Active" : "Hidden"}</dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{category.description ?? "Not provided"}</dd>
                </div>
              </dl>
            )}
          </section>

          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Supply options</h2>
              <span className="admin-card__hint">Quantity unit + packaging combinations</span>
            </div>

            <p className="admin-form__note">
              Products in this category show these combinations on the shop. If this category has no
              options, the shop falls back to its parent category.
            </p>

            {options.length === 0 ? (
              <AdminEmpty
                description="Add a combination below, or define options on the parent category."
                title="No supply options yet"
              />
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Unit</th>
                      <th scope="col">Packaging</th>
                      <th scope="col">Pack size</th>
                      <th scope="col">Min order</th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="admin-visually-hidden">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((option) => (
                      <tr key={option.id}>
                        <td>
                          <span className="admin-table__primary">{option.unitName}</span>
                          <span className="admin-table__sub">
                            {unitLabel(option)} {option.isDefault ? "· Default" : ""}
                          </span>
                        </td>
                        <td>{option.packagingName}</td>
                        <td>
                          {option.defaultPackSize
                            ? formatNumber(Number(option.defaultPackSize))
                            : "—"}
                        </td>
                        <td>
                          {formatNumber(Number(option.minimumOrderQuantity))} {option.unitSymbol}
                        </td>
                        <td>
                          <span
                            className={`admin-badge admin-badge--${option.isActive ? "active" : "inactive"}`}
                          >
                            {option.isActive ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td className="admin-table__actions">
                          {writable ? (
                            <>
                              <details className="admin-details">
                                <summary className="admin-btn admin-btn--small">Edit</summary>
                                <form
                                  action={updateCategoryOptionAction.bind(
                                    null,
                                    category.id,
                                    option.id,
                                  )}
                                  className="admin-details__body admin-form"
                                >
                                  <div className="admin-form__grid">
                                    <AdminField id={`unit-${option.id}`} label="Measurement unit">
                                      <select
                                        className="admin-input"
                                        defaultValue={option.quantityUnitId}
                                        id={`unit-${option.id}`}
                                        name="quantityUnitId"
                                        required
                                      >
                                        {units.map((unit) => (
                                          <option key={unit.id} value={unit.id}>
                                            {unit.name} ({unit.symbol})
                                            {unit.isActive ? "" : " · hidden"}
                                          </option>
                                        ))}
                                      </select>
                                    </AdminField>
                                    <AdminField
                                      id={`packaging-${option.id}`}
                                      label="Packaging type"
                                    >
                                      <select
                                        className="admin-input"
                                        defaultValue={option.packagingTypeId}
                                        id={`packaging-${option.id}`}
                                        name="packagingTypeId"
                                        required
                                      >
                                        {packaging.map((item) => (
                                          <option key={item.id} value={item.id}>
                                            {item.name}
                                            {item.isActive ? "" : " · hidden"}
                                          </option>
                                        ))}
                                      </select>
                                    </AdminField>
                                  </div>
                                  <div className="admin-form__grid">
                                    <AdminField
                                      hint="Optional pack size in this unit."
                                      id={`pack-size-${option.id}`}
                                      label="Default pack size"
                                    >
                                      <input
                                        className="admin-input"
                                        defaultValue={option.defaultPackSize ?? ""}
                                        id={`pack-size-${option.id}`}
                                        inputMode="decimal"
                                        name="defaultPackSize"
                                        placeholder="25"
                                        type="text"
                                      />
                                    </AdminField>
                                    <AdminField
                                      id={`min-order-${option.id}`}
                                      label="Minimum order"
                                    >
                                      <input
                                        className="admin-input"
                                        defaultValue={option.minimumOrderQuantity}
                                        id={`min-order-${option.id}`}
                                        inputMode="decimal"
                                        name="minimumOrderQuantity"
                                        required
                                        type="text"
                                      />
                                    </AdminField>
                                  </div>
                                  <div className="admin-option-grid">
                                    <label className="admin-check" htmlFor={`default-${option.id}`}>
                                      <input
                                        defaultChecked={option.isDefault}
                                        id={`default-${option.id}`}
                                        name="isDefault"
                                        type="checkbox"
                                      />
                                      <span>
                                        <strong>Default option</strong>
                                        <span>Highlighted first on the product page.</span>
                                      </span>
                                    </label>
                                    <label className="admin-check" htmlFor={`active-${option.id}`}>
                                      <input
                                        defaultChecked={option.isActive}
                                        id={`active-${option.id}`}
                                        name="isActive"
                                        type="checkbox"
                                      />
                                      <span>
                                        <strong>Active</strong>
                                        <span>Inactive options stay saved but are hidden.</span>
                                      </span>
                                    </label>
                                  </div>
                                  <div className="admin-form__actions">
                                    <button
                                      className="admin-btn admin-btn--primary admin-btn--small"
                                      type="submit"
                                    >
                                      Save option
                                    </button>
                                  </div>
                                </form>
                              </details>
                              <form action={deleteCategoryOptionAction.bind(null, category.id, option.id)}>
                                <ConfirmSubmitButton
                                  message={`Delete the ${option.unitName} in ${option.packagingName} option?`}
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

            {writable ? (
              <form
                action={createCategoryOptionAction.bind(null, category.id)}
                className="admin-form admin-form--sub"
              >
                <h3 className="admin-form__subheading">Add a supply option</h3>
                <div className="admin-form__grid">
                  <AdminField id="new-unit" label="Measurement unit">
                    <select className="admin-input" defaultValue="" id="new-unit" name="quantityUnitId" required>
                      <option disabled value="">
                        Select a unit
                      </option>
                      {activeUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField id="new-packaging" label="Packaging type">
                    <select
                      className="admin-input"
                      defaultValue=""
                      id="new-packaging"
                      name="packagingTypeId"
                      required
                    >
                      <option disabled value="">
                        Select packaging
                      </option>
                      {activePackaging.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                </div>
                <div className="admin-form__grid">
                  <AdminField
                    hint="Optional pack size in this unit."
                    id="new-pack-size"
                    label="Default pack size"
                  >
                    <input
                      className="admin-input"
                      id="new-pack-size"
                      inputMode="decimal"
                      name="defaultPackSize"
                      placeholder="25"
                      type="text"
                    />
                  </AdminField>
                  <AdminField id="new-min-order" label="Minimum order">
                    <input
                      className="admin-input"
                      defaultValue="1"
                      id="new-min-order"
                      inputMode="decimal"
                      name="minimumOrderQuantity"
                      required
                      type="text"
                    />
                  </AdminField>
                </div>
                <div className="admin-option-grid">
                  <label className="admin-check" htmlFor="new-default">
                    <input id="new-default" name="isDefault" type="checkbox" />
                    <span>
                      <strong>Make this the default</strong>
                      <span>Clears the default flag on other options.</span>
                    </span>
                  </label>
                  <label className="admin-check" htmlFor="new-active">
                    <input defaultChecked id="new-active" name="isActive" type="checkbox" />
                    <span>
                      <strong>Active</strong>
                      <span>Show this option on the product page.</span>
                    </span>
                  </label>
                </div>
                <div className="admin-form__actions">
                  <button className="admin-btn admin-btn--primary" type="submit">
                    Add supply option
                  </button>
                </div>
              </form>
            ) : null}
          </section>

          {writable ? (
            <section className="admin-card admin-card--danger">
              <div className="admin-card__head">
                <h2>Delete category</h2>
              </div>
              <p>
                Categories with subcategories or products cannot be deleted. Move them first, then
                delete this category. This cannot be undone.
              </p>
              <form action={deleteCategoryAction.bind(null, category.id)}>
                <ConfirmSubmitButton
                  className="admin-btn admin-btn--danger"
                  message={`Delete “${category.name}” permanently?`}
                >
                  Delete category
                </ConfirmSubmitButton>
              </form>
            </section>
          ) : null}
        </div>

        <aside className="admin-stack">
          <section className="admin-card">
            <div className="admin-card__head">
              <h2>At a glance</h2>
            </div>
            <dl className="admin-facts">
              <div>
                <dt>Parent</dt>
                <dd>{category.parentName ?? "Top level"}</dd>
              </div>
              <div>
                <dt>Products</dt>
                <dd>{category.productCount}</dd>
              </div>
              <div>
                <dt>Supply options</dt>
                <dd>{category.optionCount}</dd>
              </div>
              <div>
                <dt>Shop link</dt>
                <dd>
                  <Link href={`/shop/?category=${category.slug}`} target="_blank">
                    /shop/?category={category.slug} ↗
                  </Link>
                </dd>
              </div>
            </dl>
          </section>

          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Related setup</h2>
            </div>
            <div className="admin-stack admin-stack--tight">
              <Link className="admin-btn admin-btn--secondary admin-btn--block" href="/admin/categories/units/">
                Manage measurement units
              </Link>
              <Link
                className="admin-btn admin-btn--secondary admin-btn--block"
                href="/admin/categories/packaging/"
              >
                Manage packaging types
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
