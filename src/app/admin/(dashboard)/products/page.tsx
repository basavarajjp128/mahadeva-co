import type { Metadata } from "next";
import Link from "next/link";
import { AdminAlert, AdminEmpty, AdminPageHeader } from "@/components/admin/ui";
import { canEdit, requireAdmin } from "@/server/admin/auth";
import { listProducts } from "@/server/admin/data";
import { formatDateTime, formatKg, formatMoney } from "@/server/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const writable = canEdit(admin.role);
  const params = await searchParams;
  const search = first(params.q).slice(0, 80);
  const error = first(params.error);
  const products = await listProducts(search);

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Link className="admin-btn admin-btn--secondary" href="/shop/" target="_blank">
              View shop ↗
            </Link>
            {writable ? (
              <Link className="admin-btn admin-btn--primary" href="/admin/products/new/">
                Add product
              </Link>
            ) : null}
          </>
        }
        description="Add products with photos, edit catalogue content, keep one current price per product and maintain grades."
        eyebrow="Catalogue"
        title="Products"
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      <section className="admin-card">
        <form action="/admin/products/" className="admin-toolbar" method="get">
          <label className="admin-search" htmlFor="product-search">
            <span className="admin-visually-hidden">Search products</span>
            <input
              className="admin-input"
              defaultValue={search}
              id="product-search"
              name="q"
              placeholder="Search by name, slug or category"
              type="search"
            />
          </label>
          <button className="admin-btn admin-btn--secondary" type="submit">
            Search
          </button>
          {search ? (
            <Link className="admin-toolbar__clear" href="/admin/products/">
              Clear
            </Link>
          ) : null}
        </form>

        {products.length === 0 ? (
          <AdminEmpty
            description={
              search
                ? "No product matches that search. Try a shorter term."
                : "Products created in the database will appear here."
            }
            title={search ? "No matches" : "No products yet"}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Status</th>
                  <th scope="col">Updated</th>
                  <th scope="col">
                    <span className="admin-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const lowStock =
                    product.stockKg !== null &&
                    product.lowStockThresholdKg !== null &&
                    product.stockKg <= product.lowStockThresholdKg;

                  return (
                    <tr key={product.id}>
                      <td>
                        <span className="admin-table__primary">{product.name}</span>
                        <span className="admin-table__sub">/{product.slug}</span>
                      </td>
                      <td>{product.category}</td>
                      <td>{formatMoney(product.price)}</td>
                      <td>
                        <span className={lowStock ? "admin-text-warning" : undefined}>
                          {formatKg(product.stockKg)}
                        </span>
                        {lowStock ? <span className="admin-table__sub">Low stock</span> : null}
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${product.isActive ? "active" : "inactive"}`}
                        >
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="admin-table__time">{formatDateTime(product.updatedAt)}</td>
                      <td className="admin-table__actions">
                        <Link
                          className="admin-btn admin-btn--small"
                          href={`/admin/products/${product.id}/`}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
