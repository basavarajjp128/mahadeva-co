import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { QuantityEnquiry } from "@/components/catalogue/quantity-enquiry";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { products } from "@/data/products";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((entry) => entry.slug === slug);
  if (!product) return { title: "Product not found" };

  return {
    title: `${product.displayName} | Sample Product Details`,
    description: `${product.displayName} sample catalogue information for wholesale enquiries with SRI MAHADEVA & CO.`,
  };
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = products.find((entry) => entry.slug === slug);
  if (!product) notFound();

  return (
    <main className="product-page" id="main-content">
      <div className="container product-page__container">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop/" },
            { label: product.displayName },
          ]}
        />
        <div className="product-detail">
          <figure className="product-detail__image">
            <Image
              alt={product.imageAlt}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 48rem) 100vw, 50vw"
              src={product.image}
            />
            <figcaption>Sample catalogue image</figcaption>
          </figure>
          <article aria-labelledby="product-title" className="product-detail__content">
            <Badge>Sample listing · information only</Badge>
            <h1 id="product-title">{product.displayName}</h1>
            <p className="product-detail__description">{product.description}</p>
            <dl className="product-detail__facts">
              <div>
                <dt>Packaging</dt>
                <dd>{product.packagingInformation ?? "Not provided; confirm directly."}</dd>
              </div>
              <div>
                <dt>Catalogue status</dt>
                <dd>Sample content; not listed for purchase</dd>
              </div>
            </dl>
            <QuantityEnquiry productName={product.displayName} />
          </article>
        </div>
      </div>
    </main>
  );
}
