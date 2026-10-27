import type { Metadata } from "next";
import Link from "next/link";
import { AdminAlert, AdminEmpty, AdminPageHeader, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/auth";
import { customerEnquiryStatusLabels, supplierEnquiryStatusLabels } from "@/server/admin/constants";
import { getDashboardSnapshot } from "@/server/admin/data";
import { formatDateTime, formatKg, formatNumber } from "@/server/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const error = first(params.error);
  const snapshot = await getDashboardSnapshot();

  return (
    <>
      <AdminPageHeader
        description={`Signed in as ${admin.username}. Everything below is live from the database.`}
        eyebrow="Dashboard"
        title={`Good to see you, ${admin.fullName.split(" ")[0]}.`}
      />

      {error === "read-only" ? (
        <AdminAlert variant="error">Your role does not allow changes.</AdminAlert>
      ) : null}

      <section aria-label="Key numbers" className="admin-stats">
        <article className="admin-stat">
          <p className="admin-stat__label">Active products</p>
          <p className="admin-stat__value">{formatNumber(snapshot.productsActive)}</p>
          <p className="admin-stat__meta">of {formatNumber(snapshot.productsTotal)} in catalogue</p>
        </article>
        <article className="admin-stat">
          <p className="admin-stat__label">Stock on hand</p>
          <p className="admin-stat__value">{formatKg(snapshot.stockKg)}</p>
          <p className="admin-stat__meta">across recorded products</p>
        </article>
        <article className="admin-stat">
          <p className="admin-stat__label">Low stock</p>
          <p className="admin-stat__value">{formatNumber(snapshot.lowStockCount)}</p>
          <p className="admin-stat__meta">at or below threshold</p>
        </article>
        <article className="admin-stat">
          <p className="admin-stat__label">New enquiries</p>
          <p className="admin-stat__value">
            {formatNumber(snapshot.customerNew + snapshot.supplierNew)}
          </p>
          <p className="admin-stat__meta">
            {formatNumber(snapshot.customerNew)} buying · {formatNumber(snapshot.supplierNew)}{" "}
            selling
          </p>
        </article>
      </section>

      <div className="admin-columns">
        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Latest buying enquiries</h2>
            <Link href="/admin/enquiries/">View all</Link>
          </div>
          {snapshot.recentCustomers.length === 0 ? (
            <AdminEmpty
              description="Enquiries logged from the dashboard or captured from the website will appear here."
              title="No customer enquiries yet"
            />
          ) : (
            <ul className="admin-feed">
              {snapshot.recentCustomers.map((enquiry) => (
                <li key={enquiry.id}>
                  <div>
                    <p className="admin-feed__title">{enquiry.fullName}</p>
                    <p className="admin-feed__meta">
                      {enquiry.productName ?? "General copra enquiry"} ·{" "}
                      {enquiry.quantityKg ? formatKg(enquiry.quantityKg) : "quantity not set"}
                    </p>
                  </div>
                  <div className="admin-feed__end">
                    <StatusBadge
                      label={customerEnquiryStatusLabels[enquiry.status]}
                      status={enquiry.status}
                    />
                    <time dateTime={enquiry.createdAt.toISOString()}>
                      {formatDateTime(enquiry.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Latest selling enquiries</h2>
            <Link href="/admin/enquiries/?tab=suppliers">View all</Link>
          </div>
          {snapshot.recentSuppliers.length === 0 ? (
            <AdminEmpty
              description="Farmer offers submitted through the sell-copra form will appear here."
              title="No supplier enquiries yet"
            />
          ) : (
            <ul className="admin-feed">
              {snapshot.recentSuppliers.map((enquiry) => (
                <li key={enquiry.id}>
                  <div>
                    <p className="admin-feed__title">{enquiry.farmerName}</p>
                    <p className="admin-feed__meta">
                      {enquiry.villageTown}, {enquiry.district} · {formatKg(enquiry.quantityKg)}
                    </p>
                  </div>
                  <div className="admin-feed__end">
                    <StatusBadge
                      label={supplierEnquiryStatusLabels[enquiry.status]}
                      status={enquiry.status}
                    />
                    <time dateTime={enquiry.createdAt.toISOString()}>
                      {formatDateTime(enquiry.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-card">
        <div className="admin-card__head">
          <h2>Quick actions</h2>
        </div>
        <div className="admin-quick">
          <Link href="/admin/products/">
            <strong>Update a product</strong>
            <span>Names, descriptions, prices and grades</span>
          </Link>
          <Link href="/admin/inventory/">
            <strong>Adjust stock</strong>
            <span>Record what is on hand right now</span>
          </Link>
          <Link href="/admin/enquiries/new/">
            <strong>Log an enquiry</strong>
            <span>Capture a phone or WhatsApp conversation</span>
          </Link>
        </div>
      </section>
    </>
  );
}
