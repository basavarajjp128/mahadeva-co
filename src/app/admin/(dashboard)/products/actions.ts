"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import type { FormState } from "@/server/admin/action-state";
import { requireEditor } from "@/server/admin/auth";
import { deleteManagedProductImage, saveProductImage } from "@/server/admin/uploads";
import {
  checkboxValue,
  fieldErrors,
  gradeSchema,
  newProductSchema,
  priceUpdateSchema,
  productUpdateSchema,
  purchaseRuleSchema,
  stringValue,
} from "@/server/admin/validation";
import { getPrismaClient } from "@/server/prisma";

function firstError(errors: Record<string, string>): string {
  return Object.values(errors)[0] ?? "Check the form and try again.";
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

function productPath(productId: string, params: Record<string, string>): string {
  const search = new URLSearchParams(params).toString();
  return `/admin/products/${productId}/${search ? `?${search}` : ""}`;
}

function readUpload(formData: FormData): File | null {
  const value = formData.get("image");
  return typeof value === "object" && value !== null && "size" in value && value.size > 0
    ? (value as File)
    : null;
}

export async function createProductAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireEditor();

  const name = stringValue(formData.get("name"));
  const slugInput = stringValue(formData.get("slug"));

  const parsed = newProductSchema.safeParse({
    name,
    slug: slugInput || slugify(name),
    category: stringValue(formData.get("category")),
    description: stringValue(formData.get("description")),
    imagePath: stringValue(formData.get("imagePath")),
    imageAlt: stringValue(formData.get("imageAlt")),
    isActive: checkboxValue(formData.get("isActive")),
    isSample: checkboxValue(formData.get("isSample")),
    price: stringValue(formData.get("price")),
  });

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  let imagePath = parsed.data.imagePath;
  let uploadedPath: string | null = null;
  const upload = readUpload(formData);
  if (upload) {
    const saved = await saveProductImage(upload);
    if (!saved.ok) {
      return { error: saved.error, fieldErrors: { image: saved.error } };
    }
    imagePath = saved.image.path;
    uploadedPath = saved.image.path;
  }

  let createdId: string;
  try {
    createdId = await getPrismaClient().$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        insert into public.products (
          name, slug, category, description, image_path, image_alt, is_active, is_sample
        )
        values (
          ${parsed.data.name},
          ${parsed.data.slug},
          ${parsed.data.category},
          nullif(${parsed.data.description}, ''),
          nullif(${imagePath}, ''),
          nullif(${parsed.data.imageAlt}, ''),
          ${parsed.data.isActive},
          ${parsed.data.isSample}
        )
        returning id
      `;

      const id = rows[0]?.id;
      if (!id) throw new Error("Product insert returned no id");

      if (parsed.data.price) {
        await tx.$executeRaw`
          insert into public.product_prices (product_id, price_per_kg, currency, valid_from)
          values (${id}::uuid, ${parsed.data.price}::numeric, 'INR', now())
        `;
      }

      return id;
    });
  } catch (caught) {
    await deleteManagedProductImage(uploadedPath);
    if (isUniqueViolation(caught)) {
      return {
        error: "That slug is already used by another product.",
        fieldErrors: { slug: "Choose a different slug." },
      };
    }
    return { error: "Could not create the product. Check the details and try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/");
  revalidatePath("/shop/");
  redirect(`/admin/products/${createdId}/?saved=created`);
}

export async function updateProductAction(productId: string, formData: FormData): Promise<void> {
  await requireEditor();

  const id = z.string().uuid().safeParse(productId);
  if (!id.success) redirect("/admin/products/?error=Unknown%20product.");

  const parsed = productUpdateSchema.safeParse({
    name: stringValue(formData.get("name")),
    slug: stringValue(formData.get("slug")),
    category: stringValue(formData.get("category")),
    description: stringValue(formData.get("description")),
    imagePath: stringValue(formData.get("imagePath")),
    imageAlt: stringValue(formData.get("imageAlt")),
    isActive: checkboxValue(formData.get("isActive")),
    isSample: checkboxValue(formData.get("isSample")),
  });

  if (!parsed.success) {
    redirect(productPath(productId, { error: firstError(fieldErrors(parsed.error)) }));
  }

  const existing = await getPrismaClient().$queryRaw<Array<{ image_path: string | null }>>`
    select image_path from public.products where id = ${productId}::uuid limit 1
  `;
  if (existing.length === 0) redirect("/admin/products/?error=Unknown%20product.");

  let imagePath = parsed.data.imagePath;
  let uploadedPath: string | null = null;
  const upload = readUpload(formData);
  if (upload) {
    const saved = await saveProductImage(upload);
    if (!saved.ok) redirect(productPath(productId, { error: saved.error }));
    imagePath = saved.image.path;
    uploadedPath = saved.image.path;
  }

  let error: string | null = null;
  try {
    await getPrismaClient().$executeRaw`
      update public.products
         set name = ${parsed.data.name},
             slug = ${parsed.data.slug},
             category = ${parsed.data.category},
             description = nullif(${parsed.data.description}, ''),
             image_path = nullif(${imagePath}, ''),
             image_alt = nullif(${parsed.data.imageAlt}, ''),
             is_active = ${parsed.data.isActive},
             is_sample = ${parsed.data.isSample},
             updated_at = now()
       where id = ${productId}::uuid
    `;
  } catch (caught) {
    error = isUniqueViolation(caught)
      ? "That slug is already used by another product."
      : "Could not save the product.";
  }

  if (error) {
    await deleteManagedProductImage(uploadedPath);
    redirect(productPath(productId, { error }));
  }

  if (uploadedPath && existing[0]?.image_path !== uploadedPath) {
    await deleteManagedProductImage(existing[0]?.image_path ?? null);
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/");
  revalidatePath("/shop/");
  redirect(productPath(productId, { saved: "details" }));
}

export async function updatePriceAction(productId: string, formData: FormData): Promise<void> {
  await requireEditor();

  const id = z.string().uuid().safeParse(productId);
  if (!id.success) redirect("/admin/products/?error=Unknown%20product.");

  const parsed = priceUpdateSchema.safeParse({
    price: stringValue(formData.get("price")),
  });

  if (!parsed.success) {
    redirect(productPath(productId, { error: firstError(fieldErrors(parsed.error)) }));
  }

  const price = parsed.data.price;
  const prisma = getPrismaClient();

  let error: string | null = null;
  try {
    await prisma.$transaction([
      prisma.$executeRaw`
        update public.product_prices
           set valid_until = now()
         where product_id = ${productId}::uuid
           and valid_until is null
      `,
      prisma.$executeRaw`
        insert into public.product_prices (product_id, price_per_kg, currency, valid_from)
        values (${productId}::uuid, ${price}::numeric, 'INR', now())
      `,
    ]);
  } catch {
    error = "Could not save the price.";
  }

  if (error) redirect(productPath(productId, { error }));

  revalidatePath("/admin/products");
  revalidatePath("/admin/");
  revalidatePath("/shop/");
  redirect(productPath(productId, { saved: "price" }));
}

export async function updatePurchaseRuleAction(
  productId: string,
  formData: FormData,
): Promise<void> {
  await requireEditor();

  const id = z.string().uuid().safeParse(productId);
  if (!id.success) redirect("/admin/products/?error=Unknown%20product.");

  const parsed = purchaseRuleSchema.safeParse({
    minQuantityKg: stringValue(formData.get("minQuantityKg")),
    directCheckoutMaxKg: stringValue(formData.get("directCheckoutMaxKg")),
    requiresEnquiryAbove: checkboxValue(formData.get("requiresEnquiryAbove")),
  });

  if (!parsed.success) {
    redirect(productPath(productId, { error: firstError(fieldErrors(parsed.error)) }));
  }

  const minQuantity = parsed.data.minQuantityKg || "1";
  const maxQuantity = parsed.data.directCheckoutMaxKg || null;

  let error: string | null = null;
  try {
    await getPrismaClient().$executeRaw`
      insert into public.product_purchase_rules (
        product_id, min_quantity_kg, direct_checkout_max_kg, requires_enquiry_above, updated_at
      )
      values (
        ${productId}::uuid,
        ${minQuantity}::numeric,
        ${maxQuantity}::numeric,
        ${parsed.data.requiresEnquiryAbove},
        now()
      )
      on conflict (product_id) do update
        set min_quantity_kg = excluded.min_quantity_kg,
            direct_checkout_max_kg = excluded.direct_checkout_max_kg,
            requires_enquiry_above = excluded.requires_enquiry_above,
            updated_at = now()
    `;
  } catch {
    error = "Could not save the checkout rule.";
  }

  if (error) redirect(productPath(productId, { error }));

  revalidatePath(`/admin/products/${productId}`);
  redirect(productPath(productId, { saved: "rules" }));
}

export async function addGradeAction(productId: string, formData: FormData): Promise<void> {
  await requireEditor();

  const id = z.string().uuid().safeParse(productId);
  if (!id.success) redirect("/admin/products/?error=Unknown%20product.");

  const parsed = gradeSchema.safeParse({
    name: stringValue(formData.get("name")),
    description: stringValue(formData.get("description")),
  });

  if (!parsed.success) {
    redirect(productPath(productId, { error: firstError(fieldErrors(parsed.error)) }));
  }

  let error: string | null = null;
  try {
    await getPrismaClient().$executeRaw`
      insert into public.product_grades (product_id, name, description)
      values (
        ${productId}::uuid,
        ${parsed.data.name},
        nullif(${parsed.data.description}, '')
      )
    `;
  } catch (caught) {
    error = isUniqueViolation(caught)
      ? "That grade already exists for this product."
      : "Could not add the grade.";
  }

  if (error) redirect(productPath(productId, { error }));

  revalidatePath(`/admin/products/${productId}`);
  redirect(productPath(productId, { saved: "grade" }));
}

export async function toggleGradeAction(gradeId: string, productId: string): Promise<void> {
  await requireEditor();

  const grade = z.string().uuid().safeParse(gradeId);
  const product = z.string().uuid().safeParse(productId);
  if (!grade.success || !product.success) redirect("/admin/products/");

  await getPrismaClient().$executeRaw`
    update public.product_grades
       set is_active = not is_active
     where id = ${gradeId}::uuid
       and product_id = ${productId}::uuid
  `;

  revalidatePath(`/admin/products/${productId}`);
  redirect(productPath(productId, { saved: "grade" }));
}
