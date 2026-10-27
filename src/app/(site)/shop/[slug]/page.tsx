import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { QuantityEnquiry } from "@/components/catalogue/quantity-enquiry";
import { PaymentCheckout } from "@/components/catalogue/payment-checkout";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { getActiveProductBySlug } from "@/server/catalogue";
import { getCheckoutPrice, getDisplayPrice } from "@/server/payment-pricing";
import { readServerPaymentEnv } from "@/server/payment-env";

export const dynamic = "force-dynamic";

export const dynamicParams = true;

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getActiveProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: `${product.displayName} | SRI MAHADEVA & CO`,
    description:
      product.description ?? `Product information for ${product.displayName} wholesale enquiries.`,
  };
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getActiveProductBySlug(slug);
  if (!product) notFound();
  const displayPrice = getDisplayPrice(product);
  const checkoutPrice = getCheckoutPrice(product);
  const checkoutEnabled = Boolean(checkoutPrice && readServerPaymentEnv());

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
          <figure className="product-detail__image" data-reveal>
            <div className="product-detail__image-frame">
              <Image
                alt={product.imageAlt}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 48rem) 100vw, 50vw"
                src={product.image}
              />
            </div>
            <figcaption>Product image</figcaption>
          </figure>
          <article aria-labelledby="product-title" className="product-detail__content" data-reveal>
            <Badge>
              {product.isTestData
                ? "Development test fixture · TEST ONLY"
                : product.isSample
                  ? "Sample listing · information only"
                  : "Wholesale catalogue listing"}
            </Badge>
            <h1 id="product-title">{product.displayName}</h1>
            {product.description ? (
              <p className="product-detail__description">{product.description}</p>
            ) : null}
            <dl className="product-detail__facts">
              <div>
                <dt>Packaging</dt>
                <dd>{product.packagingInformation ?? "Not provided; confirm directly."}</dd>
              </div>
              <div>
                <dt>Catalogue status</dt>
                <dd>
                  {product.isTestData
                    ? "Development fixture only; not a real product or offer"
                    : product.isSample
                      ? "Sample content; not listed for purchase"
                      : "Enquire to confirm availability and trading terms"}
                </dd>
              </div>
            </dl>
            <PaymentCheckout
              enabled={checkoutEnabled}
              isTestData={Boolean(product.isTestData && displayPrice)}
              testDirectCheckoutAllowed={Boolean(checkoutPrice?.onlineCheckoutApproved)}
              pricePerKgMinor={displayPrice?.pricePerKgMinor}
              priceCurrency={displayPrice?.currency}
              productName={product.displayName}
              productSlug={product.slug}
            />
            <QuantityEnquiry productSlug={product.slug} />
          </article>
        </div>
      </div>
    </main>
  );
}
