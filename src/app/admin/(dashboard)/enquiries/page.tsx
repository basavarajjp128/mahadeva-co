import type { Metadata } from "next";
import Link from "next/link";
import {
  updateCustomerEnquiryStatusAction,
  updateSupplierEnquiryStatusAction,
} from "@/app/admin/(dashboard)/enquiries/actions";
import { AdminAlert, AdminEmpty, AdminPageHeader, StatusBadge } from "@/components/admin/ui";
import { canEdit, requireAdmin } from "@/server/admin/auth";
import {
  type CustomerEnquiryStatus,
  customerEnquiryStatuses,
  customerEnquiryStatusLabels,
  enquirySourceLabels,
  type SupplierEnquiryStatus,
  supplierEnquiryStatuses,
  supplierEnquiryStatusLabels,
} from "@/server/admin/constants";
import {
  getEnquiryCounts,
  listCustomerEnquiries,
  listSupplierEnquiries,
} from "@/server/admin/data";
import { formatDateTime, formatKg } from "@/server/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enquiries",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function tabHref(tab: "customers" | "suppliers", status = ""): string {
  const search = new URLSearchParams({ tab });
  if (status) search.set("status", status);
  return `/admin/enquiries/?${search.toString()}`;
}

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const writable = canEdit(admin.role);
  const params = await searchParams;

  const tab = first(params.tab) === "suppliers" ? "suppliers" : "customers";
  const rawStatus = first(params.status);
  const error = first(params.error);
  const saved = first(params.saved);

  const customerStatus =
    customerEnquiryStatuses.find((status) => status === rawStatus) ?? ("" as const);
  const supplierStatus =
    supplierEnquiryStatuses.find((status) => status === rawStatus) ?? ("" as const);

  const [customers, suppliers, counts] = await Promise.all([
    tab === "customers" ? listCustomerEnquiries(customerStatus) : Promise.resolve([]),
    tab === "suppliers" ? listSupplierEnquiries(supplierStatus) : Promise.resolve([]),
    getEnquiryCounts(),
  ]);

  const statuses =
    tab === "customers"
      ? customerEnquiryStatuses.map((value) => ({
          value,
          label: customerEnquiryStatusLabels[value],
        }))
      : supplierEnquiryStatuses.map((value) => ({
          value,
          label: supplierEnquiryStatusLabels[value],
        }));

  const activeStatus = tab === "customers" ? customerStatus : supplierStatus;

  return (
    <>
      <AdminPageHeader
        actions={
          writable && tab === "customers" ? (
            <Link className="admin-btn admin-btn--primary" href="/admin/enquiries/new/">
              Log an enquiry
            </Link>
          ) : undefined
        }
        description="Buying enquiries are logged here. Selling enquiries record farmers offering copra to the business."
        eyebrow="Enquiries"
        title="Follow-up queue"
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
      {saved ? <AdminAlert variant="success">Enquiry updated.</AdminAlert> : null}

      <div className="admin-tabs" role="tablist" aria-label="Enquiry types">
        <Link
          aria-current={tab === "customers" ? "page" : undefined}
          className={`admin-tab${tab === "customers" ? " admin-tab--active" : ""}`}
          href={tabHref("customers")}
          role="tab"
        >
          Buying enquiries
          <span className="admin-tab__count">{counts.customers}</span>
        </Link>
        <Link
          aria-current={tab === "suppliers" ? "page" : undefined}
          className={`admin-tab${tab === "suppliers" ? " admin-tab--active" : ""}`}
          href={tabHref("suppliers")}
          role="tab"
        >
          Selling enquiries
          <span className="admin-tab__count">{counts.suppliers}</span>
        </Link>
      </div>

      <nav aria-label="Filter by status" className="admin-filters">
        <Link
          className={`admin-filter${activeStatus === "" ? " admin-filter--active" : ""}`}
          href={tabHref(tab)}
        >
          All
        </Link>
        {statuses.map((status) => (
          <Link
            className={`admin-filter${activeStatus === status.value ? " admin-filter--active" : ""}`}
            href={tabHref(tab, status.value)}
            key={status.value}
          >
            {status.label}
          </Link>
        ))}
      </nav>

      {tab === "customers" ? (
        <section className="admin-card" aria-label="Buying enquiries">
          {customers.length === 0 ? (
            <AdminEmpty
              description="Use “Log an enquiry” to capture a phone, WhatsApp or walk-in conversation. Website enquiries are not stored yet."
              title="No buying enquiries in this view"
            />
          ) : (
            <ul className="admin-enquiries">
              {customers.map((enquiry) => (
                <li key={enquiry.id}>
                  <details className="admin-enquiry">
                    <summary className="admin-enquiry__summary">
                      <span className="admin-enquiry__identity">
                        <span className="admin-table__primary">{enquiry.fullName}</span>
                        <span className="admin-table__sub">
                          {enquiry.productName ?? "General copra enquiry"} ·{" "}
                          {enquiry.quantityKg ? formatKg(enquiry.quantityKg) : "quantity not set"}
                        </span>
                      </span>
                      <span className="admin-enquiry__end">
                        <StatusBadge
                          label={
                            customerEnquiryStatusLabels[enquiry.status as CustomerEnquiryStatus]
                          }
                          status={enquiry.status}
                        />
                        <time dateTime={enquiry.createdAt.toISOString()}>
                          {formatDateTime(enquiry.createdAt)}
                        </time>
                      </span>
                    </summary>

                    <div className="admin-enquiry__body">
                      <dl className="admin-detail-grid">
                        <div>
                          <dt>Phone</dt>
                          <dd>
                            <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
                          </dd>
                        </div>
                        <div>
                          <dt>Email</dt>
                          <dd>
                            {enquiry.email ? (
                              <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                            ) : (
                              "—"
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>Source</dt>
                          <dd>
                            {enquirySourceLabels[
                              enquiry.source as keyof typeof enquirySourceLabels
                            ] ?? enquiry.source}
                          </dd>
                        </div>
                        <div>
                          <dt>Received</dt>
                          <dd>{formatDateTime(enquiry.createdAt)}</dd>
                        </div>
                      </dl>

                      {enquiry.message ? (
                        <div className="admin-quote">
                          <p className="admin-quote__label">Message</p>
                          <p>{enquiry.message}</p>
                        </div>
                      ) : null}

                      {writable ? (
                        <form
                          action={updateCustomerEnquiryStatusAction}
                          className="admin-status-form"
                        >
                          <input name="id" type="hidden" value={enquiry.id} />
                          <label
                            className="admin-field admin-field--compact"
                            htmlFor={`status-${enquiry.id}`}
                          >
                            <span className="admin-field__label">Status</span>
                            <select
                              className="admin-select"
                              defaultValue={enquiry.status}
                              id={`status-${enquiry.id}`}
                              name="status"
                            >
                              {customerEnquiryStatuses.map((value) => (
                                <option key={value} value={value}>
                                  {customerEnquiryStatusLabels[value]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            className="admin-btn admin-btn--primary admin-btn--small"
                            type="submit"
                          >
                            Update
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="admin-card" aria-label="Selling enquiries">
          {suppliers.length === 0 ? (
            <AdminEmpty
              description="Farmers submitting copra through the sell-copra form will appear here."
              title="No selling enquiries in this view"
            />
          ) : (
            <ul className="admin-enquiries">
              {suppliers.map((enquiry) => (
                <li key={enquiry.id}>
                  <details className="admin-enquiry">
                    <summary className="admin-enquiry__summary">
                      <span className="admin-enquiry__identity">
                        <span className="admin-table__primary">{enquiry.farmerName}</span>
                        <span className="admin-table__sub">
                          {enquiry.villageTown}, {enquiry.district} · {formatKg(enquiry.quantityKg)}
                          {enquiry.gradeName ? ` · ${enquiry.gradeName}` : ""}
                        </span>
                      </span>
                      <span className="admin-enquiry__end">
                        <StatusBadge
                          label={
                            supplierEnquiryStatusLabels[enquiry.status as SupplierEnquiryStatus]
                          }
                          status={enquiry.status}
                        />
                        <time dateTime={enquiry.createdAt.toISOString()}>
                          {formatDateTime(enquiry.createdAt)}
                        </time>
                      </span>
                    </summary>

                    <div className="admin-enquiry__body">
                      <dl className="admin-detail-grid">
                        <div>
                          <dt>Phone</dt>
                          <dd>
                            <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
                          </dd>
                        </div>
                        <div>
                          <dt>Product</dt>
                          <dd>{enquiry.productName ?? "—"}</dd>
                        </div>
                        <div>
                          <dt>Quantity</dt>
                          <dd>{formatKg(enquiry.quantityKg)}</dd>
                        </div>
                        <div>
                          <dt>Received</dt>
                          <dd>{formatDateTime(enquiry.createdAt)}</dd>
                        </div>
                      </dl>

                      {enquiry.notes ? (
                        <div className="admin-quote">
                          <p className="admin-quote__label">Farmer notes</p>
                          <p>{enquiry.notes}</p>
                        </div>
                      ) : null}

                      {writable ? (
                        <form
                          action={updateSupplierEnquiryStatusAction}
                          className="admin-status-form"
                        >
                          <input name="id" type="hidden" value={enquiry.id} />
                          <label
                            className="admin-field admin-field--compact"
                            htmlFor={`status-${enquiry.id}`}
                          >
                            <span className="admin-field__label">Status</span>
                            <select
                              className="admin-select"
                              defaultValue={enquiry.status}
                              id={`status-${enquiry.id}`}
                              name="status"
                            >
                              {supplierEnquiryStatuses.map((value) => (
                                <option key={value} value={value}>
                                  {supplierEnquiryStatusLabels[value]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            className="admin-btn admin-btn--primary admin-btn--small"
                            type="submit"
                          >
                            Update
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
