import Image from "next/image";
import type { Product } from "@/data/products";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppEnquiryLink } from "@/components/site/whatsapp-enquiry-link";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article aria-labelledby={`product-${product.slug}`} className="product-card">
      <div className="product-card__image">
        <Image alt={product.imageAlt} height={760} src={product.image} width={900} />
      </div>
      <div className="product-card__body">
        <div className="product-card__topline">
          <h3 className="product-card__title" id={`product-${product.slug}`}>
            {product.displayName}
          </h3>
          <Badge>Sample listing</Badge>
        </div>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__detail">Information only · not for purchase</span>
          <ButtonLink href={`/shop/${product.slug}/`} size="small" variant="secondary">
            View details{" "}
            <span aria-hidden="true" className="button__arrow">
              →
            </span>
          </ButtonLink>
        </div>
        <WhatsAppEnquiryLink
          className="product-card__enquiry"
          message={`Hello, I would like information about ${product.displayName}.`}
          size="small"
          variant="primary"
        >
          Enquire about this sample
        </WhatsAppEnquiryLink>
      </div>
    </article>
  );
}
