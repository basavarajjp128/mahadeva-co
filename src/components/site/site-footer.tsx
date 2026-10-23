import { brand } from "@/config/brand";
import { contactDetails, getMailtoHref, getTelHref } from "@/config/contact";
import { siteNavigation } from "@/config/navigation";
import { BrandMark } from "./brand-mark";
import { EnquiryLink } from "./enquiry-link";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="contact-details">
      <div className="container">
        <div className="site-footer__top">
          <div>
            <BrandMark />
            <p className="site-footer__note">
              {brand.businessType} · {brand.market}
            </p>
          </div>
          <section aria-labelledby="contact-details-heading" className="site-footer__contacts">
            <h2 className="site-footer__heading" id="contact-details-heading">
              Contact details
            </h2>
            <dl className="contact-list">
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  {contactDetails.whatsappNumber ?? "Not configured — see src/config/contact.ts"}
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  {getTelHref() ? (
                    <a href={getTelHref() ?? undefined}>{contactDetails.phone}</a>
                  ) : (
                    "Not configured — see src/config/contact.ts"
                  )}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  {getMailtoHref() ? (
                    <a href={getMailtoHref() ?? undefined}>{contactDetails.email}</a>
                  ) : (
                    "Not configured — see src/config/contact.ts"
                  )}
                </dd>
              </div>
              <div>
                <dt>Business address</dt>
                <dd>{contactDetails.businessAddress ?? "[Add approved business address]"}</dd>
              </div>
            </dl>
          </section>
        </div>
        <nav aria-label="Footer navigation" className="footer-nav">
          {siteNavigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <EnquiryLink className="site-footer__enquiry" context={{ type: "general" }} size="small">
          Make an enquiry
        </EnquiryLink>
      </div>
    </footer>
  );
}
