import Link from "next/link";

export function BrandMark() {
  return (
    <Link aria-label="SRI MAHADEVA & CO home" className="brand-mark" href="/">
      <span aria-hidden="true" className="brand-mark__prefix">
        SRI
      </span>
      <span aria-hidden="true" className="brand-mark__name">
        MAHADEVA <span className="brand-mark__suffix">&amp; CO</span>
      </span>
    </Link>
  );
}
