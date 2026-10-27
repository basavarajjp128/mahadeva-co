import Image from "next/image";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EnquiryLink } from "@/components/site/enquiry-link";

export function ProductCard({
  product,
  titleLevel = "h3",
}: {
  product: Product;
  titleLevel?: "h2" | "h3";
}) {
  const Title = titleLevel;
  return (
    <article aria-labelledby={`product-${product.slug}`} className="product-card" data-reveal>
      <div className="product-card__image">
        <Image alt={product.imageAlt} height={760} src={product.image} width={900} />
      </div>
      <div className="product-card__body">
        {product.categoryName ? (
          <p className="product-card__category">
            {product.categoryParentName ? `${product.categoryParentName} / ` : ""}
            {product.categoryName}
          </p>
        ) : null}
        <div className="product-card__topline">
          <Title className="product-card__title" id={`product-${product.slug}`}>
            {product.displayName}
          </Title>
          <Badge>
            {product.isTestData ? "TEST ONLY" : product.isSample ? "Sample listing" : "Catalogue"}
          </Badge>
        </div>
        {product.description ? (
          <p className="product-card__description">{product.description}</p>
        ) : null}
        {product.supplyOptions && product.supplyOptions.length > 0 ? (
          <ul aria-label="Supply options" className="product-card__supply">
            {product.supplyOptions.slice(0, 3).map((option) => (
              <li key={option.id}>
                {option.packSize
                  ? `${Number(option.packSize)} ${option.unitSymbol}`
                  : option.unitName}{" "}
                · {option.packagingName}
              </li>
            ))}
            {product.supplyOptions.length > 3 ? (
              <li>+{product.supplyOptions.length - 3} more</li>
            ) : null}
          </ul>
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
