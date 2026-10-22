import Image from "next/image";
import { ProductCard } from "@/components/catalogue/product-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import { products } from "@/data/products";

export default function Home() {
  const product = products[0];

  return (
    <main id="main-content">
      <section aria-labelledby="hero-title" className="hero">
        <div className="container hero__grid">
          <div className="hero__content">
            <p className="eyebrow">Coconut copra · wholesale trade</p>
            <h1 className="display-heading hero__title" id="hero-title">
              Coconut copra for <span>wholesale trade.</span>
            </h1>
            <p className="body-copy hero__description">
              {brand.name} is a coconut copra wholesale trading business in India. Start with a
              focused product enquiry and discuss your requirements directly.
            </p>
            <div className="hero__actions">
              <ButtonLink href="#product">
                Explore the product{" "}
                <span aria-hidden="true" className="button__arrow">
                  ↘
                </span>
              </ButtonLink>
              <ButtonLink href="#bulk-orders" variant="secondary">
                Bulk order enquiries
              </ButtonLink>
            </div>
            <p className="hero__note">
              <span aria-hidden="true" className="hero__note-mark">
                i
              </span>
              Product grade, specifications and availability are confirmed during enquiry.
            </p>
          </div>

          <figure className="hero-art">
            <Image
              alt="Editorial illustration of coconut halves and dried copra pieces"
              height={760}
              loading="eager"
              src="/images/copra-editorial.svg"
              width={900}
            />
            <figcaption className="hero-art__caption">
              <div>
                <strong>From coconut to copra</strong>
                <span>A closer look at the trade</span>
              </div>
              <span className="art-index">01 / 01</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-label="Trade overview" className="trade-note">
        <div className="container trade-note__grid">
          <div className="trade-note__item">
            <span aria-hidden="true" className="trade-note__index">
              01
            </span>
            Coconut copra
          </div>
          <div className="trade-note__item">
            <span aria-hidden="true" className="trade-note__index">
              02
            </span>
            Wholesale enquiries
          </div>
          <div className="trade-note__item">
            <span aria-hidden="true" className="trade-note__index">
              03
            </span>
            Based in India
          </div>
        </div>
      </section>

      <section
        aria-labelledby="product-heading"
        className="catalogue-section section-space"
        id="product"
      >
        <div className="container catalogue-layout">
          <div className="catalogue-intro">
            <SectionHeading eyebrow="Product focus" id="product-heading">
              A focused copra catalogue.
            </SectionHeading>
            <p className="body-copy">
              Product information stays clear and practical. Discuss grade and quantity needs
              directly as part of a wholesale enquiry.
            </p>
          </div>
          <ProductCard product={product} />
        </div>
      </section>

      <section aria-labelledby="about-heading" className="about-section section-space" id="about">
        <div className="container about-section__grid">
          <SectionHeading eyebrow="About the business" id="about-heading">
            A trade built around coconut copra.
          </SectionHeading>
          <p className="about-section__copy">
            {brand.description} The focus is to keep product information clear and make wholesale
            enquiries straightforward.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="enquiry-heading"
        className="enquiry-section section-space"
        id="bulk-orders"
      >
        <div className="container">
          <div className="enquiry-panel">
            <div className="enquiry-panel__copy">
              <p className="eyebrow">Wholesale enquiries</p>
              <h2 className="section-heading" id="enquiry-heading">
                Planning a bulk requirement?
              </h2>
              <p className="body-copy">
                Share the product grade and volume you have in mind so the enquiry can start with
                the right details.
              </p>
            </div>
            <ButtonLink href="#product">
              Review product details{" "}
              <span aria-hidden="true" className="button__arrow">
                ↗
              </span>
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
