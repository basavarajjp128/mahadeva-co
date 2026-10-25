import Image from "next/image";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EnquiryLink } from "@/components/site/enquiry-link";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article aria-labelledby={`product-${product.slug}`} className="product-card" data-reveal>
      <div className="product-card__image">
        <Image alt={product.imageAlt} height={760} src={product.image} width={900} />
      </div>
      <div className="product-card__body">
        <div className="product-card__topline">
          <h3 className="product-card__title" id={`product-${product.slug}`}>
            {product.displayName}
          </h3>
          <Badge>
            {product.isTestData ? "TEST ONLY" : product.isSample ? "Sample listing" : "Catalogue"}
          </Badge>
        </div>
        {product.description ? (
          <p className="product-card__description">{product.description}</p>
        ) : null}
        <div className="product-card__footer">
          <span className="product-card__detail">
            {product.isTestData
              ? "Development fixture · no real offer"
              : product.isSample
                ? "Information only · not for purchase"
                : "Enquire to confirm terms"}
          </span>
          <ButtonLink href={`/shop/${product.slug}/`} size="small" variant="secondary">
            View details{" "}
            <span aria-hidden="true" className="button__arrow">
              →
            </span>
          </ButtonLink>
        </div>
        <EnquiryLink
          className="product-card__enquiry"
          context={{ type: "product", productSlug: product.slug }}
          size="small"
          variant="primary"
        >
          {product.isTestData ? "Enquire about this test item" : "Enquire about this sample"}
        </EnquiryLink>
      </div>
    </article>
  );
}
