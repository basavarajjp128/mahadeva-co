import type { Metadata } from "next";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { EnquiryLink } from "@/components/site/enquiry-link";

export const metadata: Metadata = {
  title: "Bulk Orders",
  description:
    "Prepare a bulk coconut copra quotation enquiry with SRI MAHADEVA & CO. Quantities can be entered in kg, quintals, or metric tons.",
};

export default function BulkOrdersPage() {
  return (
    <main className="enquiry-page bulk-orders-page" id="main-content">
      <div className="container enquiry-page__container">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Bulk Orders" }]} />
        <header className="enquiry-page__header" data-reveal>
          <p className="eyebrow">Wholesale and bulk enquiries</p>
          <h1>Request a quotation for your requirement.</h1>
          <p>
            Share an approximate product quantity in kilograms, quintals or metric tons. The
            conversion helps describe your enquiry; it does not confirm stock, price, delivery or an
            order.
          </p>
        </header>

        <section aria-labelledby="bulk-form-heading" className="enquiry-panel-card" data-reveal>
          <div>
            <p className="eyebrow">Prepare a message</p>
            <h2 id="bulk-form-heading">Tell us what you need</h2>
            <p>
              Continue to Contact Us to share a product, approximate quantity and delivery location.
              Product details in the current catalogue are sample information and must be confirmed
              directly.
            </p>
          </div>
          <EnquiryLink context={{ type: "bulk" }}>Continue to Contact Us</EnquiryLink>
        </section>
      </div>
    </main>
  );
}
