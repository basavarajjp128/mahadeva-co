import { Breadcrumb } from "@/components/site/breadcrumb";
import { ButtonLink } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="shop-page" id="main-content">
      <div className="container shop-page__container">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop/" },
            { label: "Not found" },
          ]}
        />
        <section className="status-state" role="status">
          <h1 className="status-state__title">Product not found</h1>
          <p className="status-state__description">
            This item is not in the current sample catalogue.
          </p>
          <ButtonLink href="/shop/" size="small">
            Return to Shop
          </ButtonLink>
        </section>
      </div>
    </main>
  );
}
