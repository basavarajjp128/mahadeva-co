import Image from "next/image";

export function BrandMark({ priority = false }: { priority?: boolean }) {
  return (
    <a aria-label="SRI MAHADEVA & CO home" className="brand-mark" href="/">
      <span className="visually-hidden">SRI MAHADEVA &amp; CO</span>
      <Image
        alt=""
        aria-hidden="true"
        className="brand-mark__image"
        height={558}
        priority={priority}
        src="/images/sri-mahadeva-logo.png"
        width={600}
      />
    </a>
  );
}
