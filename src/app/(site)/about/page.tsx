import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { EnquiryLink } from "@/components/site/enquiry-link";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { aboutContent } from "@/data/page-content";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about SRI MAHADEVA & CO, a coconut copra wholesale trading business in India, and how to begin a bulk product enquiry.",
};

export default function AboutPage() {
  return (
    <main id="main-content">
      <section aria-labelledby="about-title" className="about-hero section-space">
        <div className="container">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />
          <div className="about-hero__grid">
            <div className="about-hero__copy" data-reveal>
              <p className="eyebrow">{aboutContent.introduction.eyebrow}</p>
              <h1 className="display-heading" id="about-title">
                {aboutContent.introduction.heading}
              </h1>
              <p className="body-copy">{aboutContent.introduction.description}</p>
            </div>
            <figure className="about-hero__image" data-reveal>
              <Image
                alt="A worker reaching coconuts in a tall palm tree."
                height={1000}
                src="/images/coconut-harvest.jpg"
                width={878}
              />
              <figcaption>Illustrative coconut harvest image</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section aria-labelledby="story-heading" className="story-section section-space">
        <div className="container story-section__grid">
          <SectionHeading eyebrow={aboutContent.story.eyebrow} id="story-heading">
            {aboutContent.story.heading}
          </SectionHeading>
          <div className="story-placeholder" data-reveal>
            <span className="placeholder-label">Editable content placeholder</span>
            <p>{aboutContent.story.placeholder}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="approach-heading" className="approach-section section-space">
        <div className="container">
          <SectionHeading
            description={aboutContent.approach.introduction}
            eyebrow={aboutContent.approach.eyebrow}
            id="approach-heading"
          >
            {aboutContent.approach.heading}
          </SectionHeading>
          <div className="approach-grid">
            {aboutContent.approach.points.map((point, index) => (
              <Card className="approach-card" data-reveal key={point.title}>
                <span aria-hidden="true" className="process-card__number">
                  0{index + 1}
                </span>
                <h3>{point.title}</h3>
                <p>{point.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="about-enquiry-heading" className="about-cta section-space">
        <div className="container">
          <div className="enquiry-panel" data-reveal>
            <div className="enquiry-panel__copy">
              <p className="eyebrow">Wholesale enquiries</p>
              <h2 className="section-heading" id="about-enquiry-heading">
                Have a copra requirement to discuss?
              </h2>
              <p className="body-copy">
                Share the product grade and approximate quantity you are considering. Confirm the
                product and commercial details directly before proceeding.
              </p>
            </div>
            <EnquiryLink context={{ type: "bulk" }}>Discuss a wholesale requirement</EnquiryLink>
          </div>
        </div>
      </section>
    </main>
  );
}
