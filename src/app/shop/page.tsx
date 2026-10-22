import type { Metadata } from "next";
import { ProductCard } from "@/components/catalogue/product-card";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { WhatsAppEnquiryLink } from "@/components/site/whatsapp-enquiry-link";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop | Sample Copra Catalogue",
  description:
    "Browse sample coconut copra catalogue information from SRI MAHADEVA & CO and enquire about wholesale requirements.",
};

export default function ShopPage() {
  return (
    <main className="shop-page" id="main-content">
      <div className="container shop-page__container">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <header className="shop-page__header">
          <p className="eyebrow">Catalogue · sample content</p>
          <h1>Copra for wholesale enquiries</h1>
          <p>
            This initial catalogue illustrates how product information is presented. Listings are
            samples for discussion only and are not offers for sale or confirmation of availability.
          </p>
        </header>
        {products.length > 0 ? (
          <div className="shop-product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
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
        <aside className="shop-page__enquiry">
          <div>
            <h2>Have a wholesale requirement?</h2>
            <p>Ask for product information and discuss your requirements directly.</p>
          </div>
          <WhatsAppEnquiryLink>Make an enquiry</WhatsAppEnquiryLink>
        </aside>
      </div>
    </main>
  );
}
