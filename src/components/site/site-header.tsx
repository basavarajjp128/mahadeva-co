import Link from "next/link";
import { siteNavigation } from "@/config/navigation";
import { ButtonLink } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";

function NavigationLinks() {
  return siteNavigation.map((item) => (
    <Link href={item.href} key={item.href}>
      {item.label}
    </Link>
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
          <BrandMark />
          <nav aria-label="Main navigation" className="site-nav desktop-nav">
            <NavigationLinks />
          </nav>
          <ButtonLink className="header-cta" href="#bulk-orders" size="small">
            Start an enquiry{" "}
            <span aria-hidden="true" className="button__arrow">
              ↗
            </span>
          </ButtonLink>
          <details className="mobile-nav">
            <summary aria-label="Open main navigation">Menu</summary>
            <nav aria-label="Mobile navigation" className="site-nav mobile-nav__panel">
              <NavigationLinks />
              <Link href="#bulk-orders">Start an enquiry ↗</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
