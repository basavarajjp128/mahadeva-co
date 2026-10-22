import { siteNavigation } from "@/config/navigation";
import { WhatsAppEnquiryLink } from "./whatsapp-enquiry-link";
import { BrandMark } from "./brand-mark";

function NavigationLinks() {
  return siteNavigation.map((item) => (
    <a href={item.href} key={item.href}>
      {item.label}
    </a>
  ));
}

export function SiteHeader() {
  return (
    <>
      <div className="topline">
        <p>Wholesale coconut copra · India</p>
      </div>
      <header className="site-header">
        <div className="container site-header__inner">
          <BrandMark priority />
          <nav aria-label="Main navigation" className="site-nav desktop-nav">
            <NavigationLinks />
          </nav>
          <WhatsAppEnquiryLink className="header-cta" size="small" />
          <details className="mobile-nav">
            <summary>Main menu</summary>
            <nav aria-label="Mobile navigation" className="site-nav mobile-nav__panel">
              <NavigationLinks />
              <WhatsAppEnquiryLink className="mobile-nav__cta" size="small" variant="secondary" />
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
