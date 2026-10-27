"use client";

import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import { createProductAction } from "@/app/admin/(dashboard)/products/actions";
import { ProductImageUpload } from "@/components/admin/product-image-upload";
import { AdminAlert, AdminField } from "@/components/admin/ui";
import { slugify } from "@/lib/slug";
import { emptyFormState } from "@/server/admin/action-state";

export function NewProductForm() {
  const [state, formAction, pending] = useActionState(createProductAction, emptyFormState);
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) setSlug(slugify(event.target.value));
  }

  return (
    <form action={formAction} className="admin-form">
      {state.error ? <AdminAlert variant="error">{state.error}</AdminAlert> : null}

      <div className="admin-form__grid">
        <AdminField error={state.fieldErrors?.name} id="name" label="Product name">
          <input
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
            autoComplete="off"
            className="admin-input"
            id="name"
            maxLength={160}
            name="name"
            onChange={handleNameChange}
            required
            type="text"
          />
        </AdminField>

        <AdminField
          error={state.fieldErrors?.slug}
          hint="Used in the shop URL: /shop/your-slug/"
          id="slug"
          label="URL slug"
        >
          <input
            aria-describedby={`slug-hint${state.fieldErrors?.slug ? " slug-error" : ""}`}
            autoCapitalize="none"
            autoComplete="off"
            className="admin-input"
            id="slug"
            maxLength={80}
            name="slug"
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value);
            }}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="premium-dried-copra"
            spellCheck={false}
            type="text"
            value={slug}
          />
        </AdminField>
      </div>

      <div className="admin-form__grid">
        <AdminField
          error={state.fieldErrors?.category}
          hint="Groups products in the catalogue, e.g. copra."
          id="category"
          label="Category"
        >
          <input
            aria-describedby={`category-hint${state.fieldErrors?.category ? " category-error" : ""}`}
            className="admin-input"
            defaultValue="copra"
            id="category"
            maxLength={40}
            name="category"
            required
            type="text"
          />
        </AdminField>

        <AdminField
          error={state.fieldErrors?.price}
          hint="Optional. Saved to price history as the first current price."
          id="price"
          label="Starting price per kg (INR)"
        >
          <input
            aria-describedby={`price-hint${state.fieldErrors?.price ? " price-error" : ""}`}
            className="admin-input"
            id="price"
            inputMode="decimal"
            min="0.01"
            name="price"
            placeholder="210.50"
            step="0.01"
            type="number"
          />
        </AdminField>
      </div>

      <AdminField
        error={state.fieldErrors?.description}
        hint="Shown on the shop card and product page. Leave blank to show nothing."
        id="description"
        label="Description"
      >
        <textarea
          aria-describedby={`description-hint${state.fieldErrors?.description ? " description-error" : ""}`}
          className="admin-textarea"
          id="description"
          maxLength={5000}
          name="description"
          rows={5}
        />
      </AdminField>

      <ProductImageUpload error={state.fieldErrors?.image} />

      <div className="admin-form__grid">
        <AdminField
          error={state.fieldErrors?.imagePath}
          hint="Optional alternative to an upload: a /path from public or an https:// URL."
          id="imagePath"
          label="Image path or URL"
        >
          <input
            aria-describedby={`imagePath-hint${state.fieldErrors?.imagePath ? " imagePath-error" : ""}`}
            className="admin-input"
            id="imagePath"
            maxLength={2048}
            name="imagePath"
            placeholder="/images/copra-stock.jpg"
            spellCheck={false}
            type="text"
          />
        </AdminField>

        <AdminField
          error={state.fieldErrors?.imageAlt}
          hint="Describes the image for screen readers. Defaults to the product name."
          id="imageAlt"
          label="Image alt text"
        >
          <input
            aria-describedby={`imageAlt-hint${state.fieldErrors?.imageAlt ? " imageAlt-error" : ""}`}
            className="admin-input"
            id="imageAlt"
            maxLength={160}
            name="imageAlt"
            placeholder="Dried copra pieces on a drying mat"
            type="text"
          />
        </AdminField>
      </div>

      <div className="admin-option-grid">
        <label className="admin-check" htmlFor="isActive">
          <input defaultChecked id="isActive" name="isActive" type="checkbox" />
          <span>
            <strong>Visible in shop</strong>
            <span>Publish this product to the public catalogue immediately.</span>
          </span>
        </label>

        <label className="admin-check" htmlFor="isSample">
          <input id="isSample" name="isSample" type="checkbox" />
          <span>
            <strong>Sample listing</strong>
            <span>Marks the product as information-only until terms are confirmed.</span>
          </span>
        </label>
      </div>

      <div className="admin-form__actions">
        <button className="admin-btn admin-btn--primary" disabled={pending} type="submit">
          {pending ? "Creating product…" : "Create product"}
        </button>
        <Link className="admin-btn admin-btn--ghost" href="/admin/products/">
          Cancel
        </Link>
      </div>
    </form>
  );
}
