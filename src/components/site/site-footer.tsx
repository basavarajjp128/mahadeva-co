import { brand } from "@/config/brand";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <BrandMark />
        <p className="site-footer__note">
          {brand.businessType} · {brand.market}
        </p>
      </div>
    </footer>
  );
}
