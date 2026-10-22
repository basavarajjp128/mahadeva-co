import Image from "next/image";
import type { Product } from "@/data/products";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article aria-labelledby={`product-${product.slug}`} className="product-card">
      <div className="product-card__image">
        <Image alt={product.imageAlt} height={760} src={product.image} width={900} />
      </div>
      <div className="product-card__body">
        <div className="product-card__topline">
          <h3 className="product-card__title" id={`product-${product.slug}`}>
            {product.name}
          </h3>
          <Badge>{product.category}</Badge>
        </div>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__detail">Details shared on enquiry</span>
          <ButtonLink href="#bulk-orders" size="small" variant="secondary">
            {product.enquiryLabel}{" "}
            <span aria-hidden="true" className="button__arrow">
              ↗
            </span>
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
