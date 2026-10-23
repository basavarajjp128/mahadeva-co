import { BrandMark } from "./brand-mark";
import { EnquiryLink } from "./enquiry-link";
import { NavigationLinks } from "./navigation-links";

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
          <EnquiryLink className="header-cta" size="small" variant="primary">
            Enquire now
          </EnquiryLink>
          <details className="mobile-nav">
            <summary>Main menu</summary>
            <nav aria-label="Mobile navigation" className="site-nav mobile-nav__panel">
              <NavigationLinks />
              <EnquiryLink className="mobile-nav__cta" size="small" variant="secondary">
                Enquire now
              </EnquiryLink>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
