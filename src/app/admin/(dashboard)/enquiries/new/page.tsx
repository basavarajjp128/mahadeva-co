import type { Metadata } from "next";
import Link from "next/link";
import { createCustomerEnquiryAction } from "@/app/admin/(dashboard)/enquiries/actions";
import { AdminAlert, AdminField, AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/auth";
import { enquirySourceLabels, enquirySources } from "@/server/admin/constants";
import { listProductOptions } from "@/server/admin/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Log an enquiry",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function NewCustomerEnquiryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const params = await searchParams;
  const error = first(params.error);
  const products = await listProductOptions();

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className="admin-btn admin-btn--ghost" href="/admin/enquiries/">
            ← Back to enquiries
          </Link>
        }
        description="Record a buying enquiry taken by phone, WhatsApp or in person. It appears in the buying queue immediately."
        eyebrow="Buying enquiry"
        title="Log an enquiry"
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      <section className="admin-card admin-card--form">
        <form action={createCustomerEnquiryAction} className="admin-form">
          <div className="admin-form__grid">
            <AdminField id="fullName" label="Customer name">
              <input
                autoComplete="name"
                className="admin-input"
                id="fullName"
                maxLength={120}
                name="fullName"
                required
              />
            </AdminField>

            <AdminField id="phone" label="Mobile number">
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

            <AdminField id="email" label="Email (optional)">
              <input
                autoComplete="email"
                className="admin-input"
                id="email"
                name="email"
                type="email"
              />
            </AdminField>

            <AdminField id="productId" label="Product (optional)">
              <select className="admin-select" defaultValue="" id="productId" name="productId">
                <option value="">General copra enquiry</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </AdminField>

            <AdminField
              hint="Leave blank if the customer has not specified a quantity."
              id="quantityKg"
              label="Quantity (kg, optional)"
            >
              <input
                className="admin-input"
                id="quantityKg"
                inputMode="decimal"
                min="0.001"
                name="quantityKg"
                step="0.001"
                type="number"
              />
            </AdminField>

            <AdminField id="source" label="Where did it come from?">
              <select className="admin-select" defaultValue="phone" id="source" name="source">
                {enquirySources.map((source) => (
                  <option key={source} value={source}>
                    {enquirySourceLabels[source]}
                  </option>
                ))}
              </select>
            </AdminField>
          </div>

          <AdminField
            hint="Delivery location, grade preference, timing or anything the customer asked for."
            id="message"
            label="Notes (optional)"
          >
            <textarea
              className="admin-textarea"
              id="message"
              maxLength={2000}
              name="message"
              rows={5}
            />
          </AdminField>

          <div className="admin-form__actions">
            <button className="admin-btn admin-btn--primary" type="submit">
              Save enquiry
            </button>
            <Link className="admin-btn admin-btn--ghost" href="/admin/enquiries/">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </>
  );
}
