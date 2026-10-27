import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalogue/product-card";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { EnquiryLink } from "@/components/site/enquiry-link";
import { getActiveProducts } from "@/server/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse coconut copra listings from SRI MAHADEVA & CO and enquire about wholesale requirements.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ShopFilter = {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  parentSlug: string | null;
  isGroup: boolean;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * Builds the category filter from the products that are actually visible.
 * A parent filter is added for every parent category in use so shoppers can
 * narrow to a whole group, and each child filter keeps its parent label.
 */
function buildFilters(products: Awaited<ReturnType<typeof getActiveProducts>>): ShopFilter[] {
  const filters = new Map<string, ShopFilter>();
  const leafSlugs = new Set<string>();

  for (const product of products) {
    if (!product.categoryId || !product.categoryName || !product.categorySlug) continue;
    if (leafSlugs.has(product.categorySlug)) continue;
    leafSlugs.add(product.categorySlug);
    filters.set(`category:${product.categorySlug}`, {
      id: product.categoryId,
      name: product.categoryName,
      slug: product.categorySlug,
      parentName: product.categoryParentName ?? null,
      parentSlug: product.categoryParentSlug ?? null,
      isGroup: false,
    });
  }

  for (const product of products) {
    const parentSlug = product.categoryParentSlug;
    const parentName = product.categoryParentName;
    if (!parentSlug || !parentName) continue;
    // Do not duplicate a category that already has its own products.
    if (leafSlugs.has(parentSlug)) continue;
    filters.set(`group:${parentSlug}`, {
      id: `group:${parentSlug}`,
      name: parentName,
      slug: parentSlug,
      parentName: null,
      parentSlug: null,
      isGroup: true,
    });
  }

  return [...filters.values()].sort((a, b) => {
    const groupA = a.parentName ?? a.name;
    const groupB = b.parentName ?? b.name;
    if (groupA !== groupB) return groupA.localeCompare(groupB);
    if (a.isGroup !== b.isGroup) return a.isGroup ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const selectedSlug = first(params.category).slice(0, 80);
  const allProducts = await getActiveProducts();
  const filters = buildFilters(allProducts);
  const selected = filters.find((filter) => filter.slug === selectedSlug) ?? null;

  const products = selected
    ? allProducts.filter(
        (product) =>
          product.categorySlug === selected.slug || product.categoryParentSlug === selected.slug,
      )
    : allProducts;

  return (
    <main className="shop-page" id="main-content">
      <div className="container shop-page__container">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <header className="shop-page__header" data-reveal>
          <p className="eyebrow">Wholesale catalogue</p>
          <h1>Copra for wholesale enquiries</h1>
          <p>
            Browse active catalogue listings and enquire about product details. Prices, quantities,
            packaging and trading terms must be confirmed directly.
          </p>
        </header>

        {filters.length > 0 ? (
          <nav aria-label="Filter products by category" className="shop-filters" data-reveal>
            <span className="shop-filters__label">Category</span>
            <Link
              aria-current={selected ? undefined : "page"}
              className={`shop-filter${selected ? "" : " shop-filter--active"}`}
              href="/shop/"
            >
              All products
            </Link>
            {filters.map((filter) => {
              const active = selected?.slug === filter.slug;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`shop-filter${active ? " shop-filter--active" : ""}${
                    filter.isGroup ? " shop-filter--group" : ""
                  }${filter.parentName ? " shop-filter--child" : ""}`}
                  href={`/shop/?category=${encodeURIComponent(filter.slug)}`}
                  key={filter.id}
                >
                  {filter.parentName ? `${filter.parentName} / ` : ""}
                  {filter.name}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <p aria-live="polite" className="shop-page__count" role="status">
          {products.length} {products.length === 1 ? "product" : "products"}
          {selected ? ` in ${selected.parentName ? `${selected.parentName} / ` : ""}${selected.name}` : ""}
        </p>

        {products.length > 0 ? (
          <div className="shop-product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} titleLevel="h2" />
            ))}
          </div>
        ) : (
          <section aria-live="polite" className="status-state" role="status">
            <h2 className="status-state__title">
              {selected ? "No products in this category yet" : "No catalogue entries yet"}
            </h2>
            <p className="status-state__description">
              {selected
                ? "Try another category or view the full catalogue."
                : "Product information will appear here after verified catalogue details are added."}
            </p>
            {selected ? (
              <Link className="button button--secondary" href="/shop/">
                View all products
              </Link>
            ) : null}
          </section>
        )}

        <aside className="shop-page__enquiry" data-reveal>
          <div>
            <h2>Have a wholesale requirement?</h2>
            <p>Ask for product information and discuss your requirements directly.</p>
          </div>
          <EnquiryLink context={{ type: "bulk" }}>Make an enquiry</EnquiryLink>
        </aside>
      </div>
    </main>
  );
}
