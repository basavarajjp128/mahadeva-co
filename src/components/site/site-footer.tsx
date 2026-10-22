import { brand } from "@/config/brand";
import { contactDetails } from "@/config/contact";
import { siteNavigation } from "@/config/navigation";
import { BrandMark } from "./brand-mark";

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
                <dd>{contactDetails.whatsappNumber ?? "[Add verified WhatsApp number]"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{contactDetails.phone ?? "[Add verified business phone]"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{contactDetails.email ?? "[Add verified business email]"}</dd>
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
      </div>
    </footer>
  );
}
