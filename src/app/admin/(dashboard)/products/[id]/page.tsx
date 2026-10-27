import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addGradeAction,
  toggleGradeAction,
  updatePriceAction,
  updateProductAction,
  updatePurchaseRuleAction,
} from "@/app/admin/(dashboard)/products/actions";
import { AdminAlert, AdminField, AdminPageHeader } from "@/components/admin/ui";
import { ProductImageUpload } from "@/components/admin/product-image-upload";
import { requireAdmin } from "@/server/admin/auth";
import { getProductDetail } from "@/server/admin/data";
import { formatDateTime, formatKg, formatMoney } from "@/server/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit product",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const savedMessages: Record<string, string> = {
  created: "Product created. Add stock, grades and a checkout rule when ready.",
  details: "Product details saved.",
  price: "Price updated and added to price history.",
  rules: "Checkout rule saved.",
  grade: "Grades updated.",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminProductPage({ params, searchParams }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const product = await getProductDetail(id);
  if (!product) notFound();

  const query = await searchParams;
  const error = first(query.error);
  const saved = first(query.saved);

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Link className="admin-btn admin-btn--ghost" href="/admin/products/">
              ← Back to products
            </Link>
            <Link
              className="admin-btn admin-btn--secondary"
              href={`/shop/${product.slug}/`}
              target="_blank"
            >
              View on site ↗
            </Link>
          </>
        }
        description={`/${product.slug} · Updated ${formatDateTime(product.updatedAt)}`}
        eyebrow={product.isActive ? "Active product" : "Hidden product"}
        title={product.name}
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
      {saved && savedMessages[saved] ? (
        <AdminAlert variant="success">{savedMessages[saved]}</AdminAlert>
      ) : null}

      <div className="admin-columns admin-columns--wide-left">
        <div className="admin-stack">
          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Product details</h2>
            </div>
            <form action={updateProductAction.bind(null, product.id)} className="admin-form">
              <div className="admin-form__grid">
                <AdminField id="name" label="Name">
                  <input
                    className="admin-input"
                    defaultValue={product.name}
                    id="name"
                    maxLength={160}
                    name="name"
                    required
                  />
                </AdminField>
                <AdminField id="slug" label="URL slug">
                  <input
                    className="admin-input"
                    defaultValue={product.slug}
                    id="slug"
                    maxLength={80}
                    name="slug"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    required
                  />
                </AdminField>
                <AdminField id="category" label="Category">
                  <input
                    className="admin-input"
                    defaultValue={product.category}
                    id="category"
                    maxLength={40}
                    name="category"
                    required
                  />
                </AdminField>
                <div className="admin-field admin-field--check">
                  <label className="admin-check" htmlFor="isActive">
                    <input
                      defaultChecked={product.isActive}
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                    />
                    <span>
                      <strong>Visible in shop</strong>
                      <span>
                        Hidden products stay in the database but leave the public catalogue.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="admin-form__grid">
                <AdminField
                  hint="Optional alternative to an upload: a /path from public or an https:// URL."
                  id="imagePath"
                  label="Image path or URL"
                >
                  <input
                    className="admin-input"
                    defaultValue={product.imagePath ?? ""}
                    id="imagePath"
                    maxLength={2048}
                    name="imagePath"
                    placeholder="/images/copra-stock.jpg"
                    spellCheck={false}
                    type="text"
                  />
                </AdminField>

                <AdminField
                  hint="Describe the image for screen readers. Defaults to the product name when blank."
                  id="imageAlt"
                  label="Image alt text"
                >
                  <input
                    className="admin-input"
                    defaultValue={product.imageAlt ?? ""}
                    id="imageAlt"
                    maxLength={160}
                    name="imageAlt"
                    placeholder="Dried copra pieces on a drying mat"
                    type="text"
                  />
                </AdminField>
              </div>

              <ProductImageUpload
                initialAlt={product.imageAlt ?? product.name}
                initialImage={product.imagePath}
                key={product.imagePath ?? "no-image"}
              />

              <div className="admin-option-grid">
                <label className="admin-check" htmlFor="isSample">
                  <input
                    defaultChecked={product.isSample}
                    id="isSample"
                    name="isSample"
                    type="checkbox"
                  />
                  <span>
                    <strong>Sample listing</strong>
                    <span>Marks the product as information-only until terms are confirmed.</span>
                  </span>
                </label>
              </div>

              <AdminField
                hint="Shown on the product page and in enquiry summaries."
                id="description"
                label="Description"
              >
                <textarea
                  className="admin-textarea"
                  defaultValue={product.description ?? ""}
                  id="description"
                  maxLength={5000}
                  name="description"
                  rows={6}
                />
              </AdminField>

              <div className="admin-form__actions">
                <button className="admin-btn admin-btn--primary" type="submit">
                  Save details
                </button>
              </div>
            </form>
          </section>

          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Current price</h2>
              <span className="admin-card__hint">Per kilogram · INR</span>
            </div>

            <form action={updatePriceAction.bind(null, product.id)} className="admin-form">
              <div className="admin-inline-fields">
                <AdminField id="price" label="Price per kg">
                  <input
                    className="admin-input"
                    defaultValue={product.price ?? ""}
                    id="price"
                    inputMode="decimal"
                    min="0.01"
                    name="price"
                    required
                    step="0.01"
                    type="number"
                  />
                </AdminField>
                <p className="admin-form__note">
                  Saving closes the current price row and records a new one, so history is kept.
                </p>
              </div>
              <div className="admin-form__actions">
                <button className="admin-btn admin-btn--primary" type="submit">
                  Save price
                </button>
              </div>
            </form>

            {product.priceHistory.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--compact">
                  <thead>
                    <tr>
                      <th scope="col">Price</th>
                      <th scope="col">Valid from</th>
                      <th scope="col">Valid until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.priceHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatMoney(entry.pricePerKg)}</td>
                        <td>{formatDateTime(entry.validFrom)}</td>
                        <td>{entry.validUntil ? formatDateTime(entry.validUntil) : "Current"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-muted">No price history yet.</p>
            )}
          </section>

          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Grades</h2>
              <span className="admin-card__hint">{product.grades.length} recorded</span>
            </div>

            {product.grades.length === 0 ? (
              <p className="admin-muted">No grades yet. Add one below.</p>
            ) : (
              <ul className="admin-list">
                {product.grades.map((grade) => (
                  <li key={grade.id}>
                    <div>
                      <p className="admin-list__title">{grade.name}</p>
                      {grade.description ? (
                        <p className="admin-list__meta">{grade.description}</p>
                      ) : null}
                    </div>
                    <div className="admin-list__actions">
                      <span
                        className={`admin-badge admin-badge--${grade.isActive ? "active" : "inactive"}`}
                      >
                        {grade.isActive ? "Active" : "Inactive"}
                      </span>
                      <form action={toggleGradeAction.bind(null, grade.id, product.id)}>
                        <button
                          className="admin-btn admin-btn--small admin-btn--ghost"
                          type="submit"
                        >
                          {grade.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form
              action={addGradeAction.bind(null, product.id)}
              className="admin-form admin-form--inline"
            >
              <div className="admin-inline-fields">
                <AdminField id="gradeName" label="Grade name">
                  <input
                    className="admin-input"
                    id="gradeName"
                    maxLength={60}
                    name="name"
                    required
                  />
                </AdminField>
                <AdminField id="gradeDescription" label="Description (optional)">
                  <input
                    className="admin-input"
                    id="gradeDescription"
                    maxLength={500}
                    name="description"
                  />
                </AdminField>
              </div>
              <button className="admin-btn admin-btn--secondary" type="submit">
                Add grade
              </button>
            </form>
          </section>
        </div>

        <div className="admin-stack">
          <section className="admin-card admin-card--accent">
            <div className="admin-card__head">
              <h2>Stock</h2>
            </div>
            <p className="admin-stat__value admin-stat__value--small">
              {formatKg(product.stockKg)}
            </p>
            <p className="admin-muted">
              {product.stockKg === null
                ? "No stock record yet."
                : product.lowStockThresholdKg !== null &&
                    product.stockKg <= product.lowStockThresholdKg
                  ? "At or below the low-stock threshold."
                  : "Above the low-stock threshold."}
            </p>
            <Link
              className="admin-btn admin-btn--secondary admin-btn--block"
              href="/admin/inventory/"
            >
              Update inventory
            </Link>
          </section>

          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Checkout rule</h2>
            </div>
            <form action={updatePurchaseRuleAction.bind(null, product.id)} className="admin-form">
              <AdminField id="minQuantityKg" label="Minimum quantity (kg)">
                <input
                  className="admin-input"
                  defaultValue={product.purchaseRule?.minQuantityKg ?? 1}
                  id="minQuantityKg"
                  inputMode="decimal"
                  min="0.001"
                  name="minQuantityKg"
                  step="0.001"
                  type="number"
                />
              </AdminField>
              <AdminField
                hint="Leave blank when there is no direct-checkout ceiling."
                id="directCheckoutMaxKg"
                label="Direct checkout up to (kg)"
              >
                <input
                  className="admin-input"
                  defaultValue={product.purchaseRule?.directCheckoutMaxKg ?? ""}
                  id="directCheckoutMaxKg"
                  inputMode="decimal"
                  min="0.002"
                  name="directCheckoutMaxKg"
                  step="0.001"
                  type="number"
                />
              </AdminField>
              <label className="admin-check" htmlFor="requiresEnquiryAbove">
                <input
                  defaultChecked={product.purchaseRule?.requiresEnquiryAbove ?? true}
                  id="requiresEnquiryAbove"
                  name="requiresEnquiryAbove"
                  type="checkbox"
                />
                <span>
                  <strong>Enquiry above the ceiling</strong>
                  <span>Route larger quantities to a manual enquiry.</span>
                </span>
              </label>
              <div className="admin-form__actions">
                <button className="admin-btn admin-btn--primary" type="submit">
                  Save rule
                </button>
              </div>
            </form>
          </section>

          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Record</h2>
            </div>
            <dl className="admin-meta">
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(product.createdAt)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatDateTime(product.updatedAt)}</dd>
              </div>
              <div>
                <dt>Currency</dt>
                <dd>{product.currency ?? "INR"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
