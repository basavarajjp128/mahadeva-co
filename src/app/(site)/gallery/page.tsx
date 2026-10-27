import type { Metadata } from "next";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export const metadata: Metadata = {
  title: "Our Gallery",
  description:
    "A visual introduction to coconut farms, harvested coconuts and copra for wholesale trade.",
};

export default function GalleryPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="gallery-heading" className="gallery-page section-space">
        <div className="container">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Gallery" }]} />
          <header className="gallery-page__intro">
            <p className="eyebrow">Our gallery</p>
            <h1 className="display-heading" id="gallery-heading">
              From Coconut Farms to Copra
            </h1>
            <p className="body-copy">
              From coconut farms to carefully handled copra — a glimpse into our world.
            </p>
          </header>
          <GalleryGrid />
          <p className="gallery-page__note">
            Images illustrate coconut and copra subjects; they do not imply ownership of the
            pictured farms or facilities.
          </p>
        </div>
      </section>
    </main>
  );
}
