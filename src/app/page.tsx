import type { Metadata } from "next";
import Image from "next/image";
import { ProductCard } from "@/components/catalogue/product-card";
import { EnquiryLink } from "@/components/site/enquiry-link";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import { homeContent } from "@/data/page-content";
import { getCatalogueProducts } from "@/data/catalogue";

export const metadata: Metadata = {
  title: "Wholesale Coconut Copra | SRI MAHADEVA & CO",
  description:
    "Explore coconut copra wholesale enquiries with SRI MAHADEVA & CO. Discuss product requirements and bulk quote details directly.",
};

export default function Home() {
  const products = getCatalogueProducts().slice(0, 2);
  return (
    <main id="main-content">
      <section aria-labelledby="hero-title" className="home-hero">
        <figure className="home-hero__image">
          <Image
            alt="Aerial view of a dense coconut palm plantation."
            fill
            priority
            sizes="100vw"
            src="/images/coconut-farm.jpg"
          />
          <figcaption className="home-hero__caption">
            Coconut plantation · illustrative image
          </figcaption>
        </figure>
        <div aria-hidden="true" className="home-hero__overlay" />
        <div className="container home-hero__inner">
          <div className="home-hero__content">
            <p className="home-hero__eyebrow">{homeContent.hero.eyebrow}</p>
            <h1 className="home-hero__title" id="hero-title">
              {homeContent.hero.headline}
            </h1>
            <p className="home-hero__description">{homeContent.hero.description}</p>
            <div className="home-hero__actions">
              <ButtonLink className="home-hero__primary" href="#product">
                Explore Products <span aria-hidden="true">→</span>
              </ButtonLink>
              <EnquiryLink
                className="home-hero__secondary"
                context={{ type: "bulk" }}
                variant="secondary"
              >
                Request a Bulk Quote
              </EnquiryLink>
            </div>
            <p className="home-hero__farmer-link">
              For farmers: <a href="/sell-your-copra/">Sell your copra</a>
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="product-heading"
        className="home-products section-space"
        id="product"
      >
        <div className="container home-products__layout">
          <div className="home-products__intro" data-reveal>
            <SectionHeading eyebrow={homeContent.products.eyebrow} id="product-heading">
              {homeContent.products.heading}
            </SectionHeading>
            <p className="body-copy">{homeContent.products.description}</p>
            <EnquiryLink appearance="text" context={{ type: "bulk" }}>
              Discuss a wholesale requirement
            </EnquiryLink>
          </div>
          <div className="home-products__card">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          <div className="home-products__more" data-reveal>
            <ButtonLink href="/shop/" variant="secondary">
              Explore all products <span aria-hidden="true">→</span>
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-label="Business focus" className="home-facts">
        <div className="container home-facts__grid">
          {homeContent.tradeFacts.map((item, index) => (
            <div className="home-facts__item" data-reveal key={item.title}>
              <span aria-hidden="true" className="home-facts__number">
                0{index + 1}
              </span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="bulk-orders-heading"
        className="home-bulk section-space"
        id="bulk-orders"
      >
        <div className="container">
          <div className="home-bulk__intro">
            <div className="home-bulk__heading" data-reveal>
              <SectionHeading
                description={homeContent.wholesale.description}
                eyebrow={homeContent.wholesale.eyebrow}
                id="bulk-orders-heading"
              >
                {homeContent.wholesale.heading}
              </SectionHeading>
            </div>
            <figure className="home-bulk__photo" data-reveal>
              <Image
                alt="Workers sorting and husking coconuts beneath palm trees."
                height={450}
                sizes="(max-width: 48rem) 100vw, 48vw"
                src="/images/coconut-husking.webp"
                width={800}
              />
              <figcaption>Illustrative coconut husking image</figcaption>
            </figure>
          </div>
          <div className="home-bulk__grid">
            {homeContent.wholesale.steps.map((step, index) => (
              <article className="home-bulk__step" data-reveal key={step.title}>
                <span aria-hidden="true">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
          <p className="home-bulk__note">
            Product specifications, price, packing and delivery arrangements should be confirmed for
            each enquiry.
          </p>
        </div>
      </section>

      <section aria-labelledby="quality-heading" className="home-quality section-space">
        <div className="container home-quality__grid">
          <div data-reveal>
            <SectionHeading eyebrow={homeContent.quality.eyebrow} id="quality-heading">
              {homeContent.quality.heading}
            </SectionHeading>
            <p className="body-copy">{homeContent.quality.description}</p>
          </div>
          <ul data-reveal>
            {homeContent.quality.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="about-heading" className="home-about section-space" id="about">
        <div className="container home-about__grid">
          <figure className="home-about__photo" data-reveal>
            <Image
              alt="Workers handling a large coconut harvest beneath palm trees."
              height={539}
              sizes="(max-width: 48rem) 100vw, 48vw"
              src="/images/coconut-husking-team.webp"
              width={800}
            />
            <div className="home-about__inset">
              <Image
                alt="A worker husking a coconut beneath palm trees."
                height={450}
                sizes="(max-width: 48rem) 44vw, 18vw"
                src="/images/coconut-husking.webp"
                width={800}
              />
            </div>
            <figcaption>Illustrative coconut husking imagery</figcaption>
          </figure>
          <div className="home-about__copy" data-reveal>
            <SectionHeading eyebrow="About us" id="about-heading">
              SRI MAHADEVA &amp; CO
            </SectionHeading>
            <p className="body-copy">{brand.description}</p>
            <p className="home-about__note">
              Product origin, grade, packing and trading terms are discussed and confirmed directly
              for each requirement.
            </p>
            <a className="text-link" href="/about/">
              Learn more about the business <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="enquiry-heading" className="home-enquiry section-space">
        <div className="container home-enquiry__inner" data-reveal>
          <div>
            <p className="home-enquiry__eyebrow">{homeContent.finalEnquiry.eyebrow}</p>
            <h2 id="enquiry-heading">{homeContent.finalEnquiry.heading}</h2>
            <p>{homeContent.finalEnquiry.description}</p>
          </div>
          <EnquiryLink
            className="home-enquiry__button"
            context={{ type: "general" }}
            variant="light"
          >
            Request a quotation
          </EnquiryLink>
        </div>
      </section>
    </main>
  );
}
