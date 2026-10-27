import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { QuantityEnquiry } from "@/components/catalogue/quantity-enquiry";
import { PaymentCheckout } from "@/components/catalogue/payment-checkout";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { formatQuantity } from "@/lib/quantity";
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
    title: product.displayName,
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
  const supplyOptions = product.supplyOptions ?? [];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop/" },
    ...(product.categoryName
      ? [
          {
            label: product.categoryParentName
              ? `${product.categoryParentName} / ${product.categoryName}`
              : product.categoryName,
            href: product.categorySlug
              ? `/shop/?category=${encodeURIComponent(product.categorySlug)}`
              : undefined,
          },
        ]
      : []),
    { label: product.displayName },
  ];

  return (
    <main className="product-page" id="main-content">
      <div className="container product-page__container">
        <Breadcrumb items={breadcrumbItems} />
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
            {product.categoryName ? (
              <p className="product-detail__category">
                {product.categoryParentName ? `${product.categoryParentName} / ` : ""}
                {product.categoryName}
              </p>
            ) : null}
            <h1 id="product-title">{product.displayName}</h1>
            {product.description ? (
              <p className="product-detail__description">{product.description}</p>
            ) : null}
            <dl className="product-detail__facts">
              {product.categoryName ? (
                <div>
                  <dt>Category</dt>
                  <dd>
                    {product.categorySlug ? (
                      <a href={`/shop/?category=${encodeURIComponent(product.categorySlug)}`}>
                        {product.categoryParentName
                          ? `${product.categoryParentName} / ${product.categoryName}`
                          : product.categoryName}
                      </a>
                    ) : (
                      product.categoryName
                    )}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Supply options</dt>
                <dd>
                  {supplyOptions.length > 0
                    ? `${supplyOptions.length} unit and packaging ${supplyOptions.length === 1 ? "combination" : "combinations"}`
                    : "Confirm quantity and packaging directly"}
                </dd>
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

            {supplyOptions.length > 0 ? (
              <section aria-labelledby="supply-options-title" className="product-detail__supply">
                <h2 id="supply-options-title">Available quantities and packaging</h2>
                <ul className="supply-options">
                  {supplyOptions.map((option) => (
                    <li
                      className={`supply-option${option.isDefault ? " supply-option--default" : ""}`}
                      key={option.id}
                    >
                      <div className="supply-option__main">
                        <p className="supply-option__title">
                          {option.packSize
                            ? `${formatQuantity(Number(option.packSize))} ${option.unitSymbol} pack`
                            : option.unitName}
                        </p>
                        <p className="supply-option__meta">
                          Packed in {option.packagingName}
                          {option.packagingDescription
                            ? ` — ${option.packagingDescription}`
                            : ""}
                        </p>
                      </div>
                      <p className="supply-option__meta">
                        Minimum order {formatQuantity(Number(option.minimumOrder))}{" "}
                        {option.unitSymbol}
                      </p>
                      {option.isDefault ? <Badge>Default option</Badge> : null}
                    </li>
                  ))}
                </ul>
                <p className="product-detail__supply-note">
                  Availability, final quantity and commercial terms are confirmed on enquiry.
                </p>
              </section>
            ) : (
              <p className="product-detail__supply-note">
                Quantity and packaging options are confirmed directly on enquiry.
              </p>
            )}

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
