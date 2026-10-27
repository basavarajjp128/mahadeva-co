import type { Metadata } from "next";
import Link from "next/link";
import { updateInventoryAction } from "@/app/admin/(dashboard)/inventory/actions";
import { AdminAlert, AdminEmpty, AdminPageHeader } from "@/components/admin/ui";
import { listInventory } from "@/server/admin/data";
import { formatDateTime, formatKg } from "@/server/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventory",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminInventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);
  const saved = first(params.saved);
  const items = await listInventory();

  const totalStock = items.reduce((sum, item) => sum + (item.stockKg ?? 0), 0);
  const lowStock = items.filter(
    (item) =>
      item.stockKg !== null &&
      item.lowStockThresholdKg !== null &&
      item.stockKg <= item.lowStockThresholdKg,
  ).length;

  return (
    <>
      <AdminPageHeader
        description="Record the copra physically on hand. Values are in kilograms and update the low-stock signal on the dashboard."
        eyebrow="Inventory"
        title="Stock on hand"
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
      {saved ? <AdminAlert variant="success">Stock level saved.</AdminAlert> : null}

      <section aria-label="Inventory summary" className="admin-stats admin-stats--three">
        <article className="admin-stat">
          <p className="admin-stat__label">Total stock</p>
          <p className="admin-stat__value">{formatKg(totalStock)}</p>
        </article>
        <article className="admin-stat">
          <p className="admin-stat__label">Low-stock products</p>
          <p className="admin-stat__value">{lowStock}</p>
        </article>
        <article className="admin-stat">
          <p className="admin-stat__label">Products tracked</p>
          <p className="admin-stat__value">{items.length}</p>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card__head">
          <h2>Products</h2>
          <span className="admin-card__hint">
            Saved values are recorded against your admin account.
          </span>
        </div>

        {items.length === 0 ? (
          <AdminEmpty
            description="Add products before recording stock."
            title="No products to track"
          />
        ) : (
          <ul className="admin-stock-list">
            {items.map((item) => {
              const isLow =
                item.stockKg !== null &&
                item.lowStockThresholdKg !== null &&
                item.stockKg <= item.lowStockThresholdKg;

              return (
                <li className="admin-stock" key={item.id}>
                  <div className="admin-stock__identity">
                    <Link className="admin-stock__name" href={`/admin/products/${item.id}/`}>
                      {item.name}
                    </Link>
                    <p className="admin-table__sub">
                      /{item.slug} · {item.category}
                    </p>
                    <p className="admin-stock__updated">
                      {item.inventoryUpdatedAt
                        ? `Updated ${formatDateTime(item.inventoryUpdatedAt)}`
                        : "No stock record yet"}
                    </p>
                  </div>

                  <form
                    action={updateInventoryAction.bind(null, item.id)}
                    className="admin-stock__form"
                  >
                    <label className="admin-field admin-field--compact">
                      <span className="admin-field__label">Stock (kg)</span>
                      <input
                        className="admin-input"
                        defaultValue={item.stockKg ?? 0}
                        inputMode="decimal"
                        min="0"
                        name="stockKg"
                        required
                        step="0.001"
                        type="number"
                      />
                    </label>

                    <label className="admin-field admin-field--compact">
                      <span className="admin-field__label">Low-stock alert (kg)</span>
                      <input
                        className="admin-input"
                        defaultValue={item.lowStockThresholdKg ?? 50}
                        inputMode="decimal"
                        min="0"
                        name="lowStockThresholdKg"
                        required
                        step="0.001"
                        type="number"
                      />
                    </label>

                    <div className="admin-stock__status">
                      <span className={`admin-badge admin-badge--${isLow ? "low" : "active"}`}>
                        {item.stockKg === null ? "Not counted" : isLow ? "Low stock" : "In stock"}
                      </span>
                    </div>

                    <button className="admin-btn admin-btn--primary admin-btn--small" type="submit">
                      Save
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
