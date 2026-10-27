import type { Metadata } from "next";
import { ProductCard } from "@/components/catalogue/product-card";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { EnquiryLink } from "@/components/site/enquiry-link";
import { getActiveProducts } from "@/server/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop | SRI MAHADEVA & CO",
  description:
    "Browse coconut copra listings from SRI MAHADEVA & CO and enquire about wholesale requirements.",
};

export default async function ShopPage() {
  const products = await getActiveProducts();
  return (
    <main className="shop-page" id="main-content">
      <div className="container shop-page__container">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <header className="shop-page__header" data-reveal>
          <p className="eyebrow">Wholesale catalogue</p>
          <h1>Copra for wholesale enquiries</h1>
          <p>
            Browse active catalogue listings and enquire about product details. Prices, quantities,
            packaging and trading terms must be confirmed directly.
          </p>
        </header>
        {products.length > 0 ? (
          <div className="shop-product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} titleLevel="h2" />
            ))}
          </div>
        ) : (
          <section aria-live="polite" className="status-state" role="status">
            <h2 className="status-state__title">No catalogue entries yet</h2>
            <p className="status-state__description">
              Product information will appear here after verified catalogue details are added.
            </p>
          </section>
        )}
        <aside className="shop-page__enquiry" data-reveal>
          <div>
            <h2>Have a wholesale requirement?</h2>
            <p>Ask for product information and discuss your requirements directly.</p>
          </div>
          <EnquiryLink context={{ type: "bulk" }}>Make an enquiry</EnquiryLink>
        </aside>
      </div>
    </main>
  );
}
