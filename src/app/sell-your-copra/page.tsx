import type { Metadata } from "next";
import Image from "next/image";
import { SupplierEnquiryForm } from "@/components/suppliers/supplier-enquiry-form";
import { Breadcrumb } from "@/components/site/breadcrumb";

export const metadata: Metadata = {
  title: "Sell Your Copra",
  description:
    "Farmers can share their available copra quantity, grade and location with SRI MAHADEVA & CO for a selling enquiry.",
};

export default function SellYourCopraPage() {
  return (
    <main className="supplier-page" id="main-content">
      <section aria-labelledby="supplier-hero-heading" className="supplier-hero">
        <div className="container supplier-page__breadcrumb">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Sell Copra" }]} />
        </div>
        <div className="container supplier-hero__grid">
          <div className="supplier-hero__copy" data-reveal>
            <p className="eyebrow">For coconut farmers</p>
            <h1 id="supplier-hero-heading">Sell Your Copra</h1>
            <p>
              Tell SRI MAHADEVA &amp; CO about the copra you have available. Share an estimated
              quantity, grade and location so the business owner can review your enquiry and discuss
              the next steps with you.
            </p>
            <a className="button button--primary" href="#selling-enquiry">
              Share your copra details <span aria-hidden="true">↓</span>
            </a>
            <p className="supplier-hero__disclaimer">
              A selling enquiry is not a confirmed sale, guaranteed price, or pickup arrangement.
            </p>
          </div>
          <figure className="supplier-hero__image" data-reveal>
            <Image
              alt="Coconut farming photograph supplied for the Sell Your Copra page."
              fill
              priority
              sizes="(max-width: 48rem) 100vw, 50vw"
              src="/images/farmer-copra.avif"
            />
            <figcaption>Farmer-supplied coconut image</figcaption>
          </figure>
        </div>
      </section>

      <section
        aria-labelledby="selling-enquiry-heading"
        className="supplier-enquiry section-space"
        id="selling-enquiry"
      >
        <div className="container supplier-enquiry__layout">
          <div className="supplier-enquiry__intro" data-reveal>
            <p className="eyebrow">Selling enquiry</p>
            <h2 id="selling-enquiry-heading">Share what you have available</h2>
            <p>
              Add your contact number, quantity and location. You can check the details before
              opening a WhatsApp draft addressed to the business.
            </p>
            <p className="supplier-enquiry__note">
              Quality, price and pickup must be assessed and agreed separately. Please do not make
              any payment for a supplier enquiry.
            </p>
          </div>
          <SupplierEnquiryForm />
        </div>
      </section>
    </main>
  );
}
