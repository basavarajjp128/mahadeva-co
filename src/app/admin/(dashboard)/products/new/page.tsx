import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireEditor } from "@/server/admin/auth";
import { NewProductForm } from "./new-product-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add product",
};

export default async function NewProductPage() {
  await requireEditor();

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className="admin-btn admin-btn--ghost" href="/admin/products/">
            ← Back to products
          </Link>
        }
        description="Create a catalogue entry with an uploaded photo. Price, stock and grades can be refined after saving."
        eyebrow="Catalogue"
        title="Add a product"
      />

      <section className="admin-card admin-card--form">
        <NewProductForm />
      </section>
    </>
  );
}
