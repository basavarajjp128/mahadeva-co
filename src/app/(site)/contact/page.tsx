import type { Metadata } from "next";
import { ContactContext } from "@/components/enquiries/contact-context";
import { EnquiryWorkflow } from "@/components/enquiries/enquiry-workflow";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { contactDetails, getTelHref } from "@/config/contact";
import { getActiveProducts } from "@/server/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact SRI MAHADEVA & CO about coconut copra wholesale requirements by WhatsApp or email.",
};

export default async function ContactPage() {
  const catalogueProducts = await getActiveProducts();
  return (
    <main className="enquiry-page" id="main-content">
      <div className="container enquiry-page__container">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <header className="enquiry-page__header" data-reveal>
          <p className="eyebrow">Contact SRI MAHADEVA &amp; CO</p>
          <h1>Let’s discuss your copra requirement.</h1>
          <p>
            WhatsApp is available for enquiries. Email and other business details remain
            placeholders until configured. Any prepared message stays in your chosen app for you to
            review and send; this website does not submit enquiries to a server.
          </p>
        </header>

        <div className="enquiry-page__layout">
          <section
            aria-labelledby="contact-options-heading"
            className="contact-options"
            data-reveal
          >
            <h2 id="contact-options-heading">Contact options</h2>
            <p>Use either channel to ask about product details or request a quotation.</p>
            <dl className="contact-options__list">
              <div>
                <dt>WhatsApp</dt>
                <dd>{contactDetails.whatsappNumber ?? "Not configured yet"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{contactDetails.email ?? "Not configured yet"}</dd>
              </div>
            </dl>
            <div className="contact-options__actions">
              <ContactContext products={catalogueProducts} />
              {getTelHref() ? (
                <a href={getTelHref() ?? undefined}>Call {contactDetails.phone}</a>
              ) : null}
              {!contactDetails.phone ? (
                <p className="contact-setup-message" role="status">
                  Business phone is not configured yet. Add it in <code>src/config/contact.ts</code>
                  .
                </p>
              ) : null}
            </div>
          </section>

          <section
            aria-labelledby="contact-form-heading"
            className="enquiry-panel-card"
            data-reveal
          >
            <div>
              <p className="eyebrow">No account required</p>
              <h2 id="contact-form-heading">Prepare an enquiry</h2>
              <p>
                Add your contact details and message. Product and quantity are optional for a
                general enquiry.
              </p>
            </div>
            <EnquiryWorkflow mode="contact" products={catalogueProducts} />
          </section>
        </div>
      </div>
    </main>
  );
}
