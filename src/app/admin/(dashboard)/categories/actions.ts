"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requireEditor } from "@/server/admin/auth";
import {
  categoryOptionSchema,
  categorySchema,
  categoryUnitSchema,
  checkboxValue,
  fieldErrors,
  packagingTypeSchema,
  stringValue,
} from "@/server/admin/validation";
import { getPrismaClient } from "@/server/prisma";

const categoriesPath = "/admin/categories/";
const unitsPath = "/admin/categories/units/";
const packagingPath = "/admin/categories/packaging/";

function categoryPath(id: string): string {
  return `/admin/categories/${id}/`;
}

function firstError(errors: Record<string, string>): string {
  return Object.values(errors)[0] ?? "Check the form and try again.";
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function errorCode(error: unknown): string | null {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : null;
}

function readId(value: string): string | null {
  const parsed = z.string().uuid().safeParse(value);
  return parsed.success ? parsed.data : null;
}

function revalidateCatalogue(path?: string): void {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  if (path) revalidatePath(path);
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireEditor();

  const name = stringValue(formData.get("name"));
  const parsed = categorySchema.safeParse({
    name,
    slug: stringValue(formData.get("slug")) || slugify(name),
    parentId: stringValue(formData.get("parentId")),
    description: stringValue(formData.get("description")),
    imageUrl: stringValue(formData.get("imageUrl")),
    displayOrder: stringValue(formData.get("displayOrder")) || "0",
    isActive: checkboxValue(formData.get("isActive")),
  });

  if (!parsed.success) fail(categoriesPath, firstError(fieldErrors(parsed.error)));

  try {
    await getPrismaClient().$executeRaw`
      insert into public.product_categories (
        name, slug, parent_id, description, image_url, display_order, is_active
      )
      values (
        ${parsed.data.name},
        ${parsed.data.slug},
        nullif(${parsed.data.parentId}, '')::uuid,
        nullif(${parsed.data.description}, ''),
        nullif(${parsed.data.imageUrl}, ''),
        ${Number(parsed.data.displayOrder)},
        ${parsed.data.isActive}
      )
    `;
  } catch (caught) {
    const code = errorCode(caught);
    if (code === "23505") fail(categoriesPath, "That category slug is already in use.");
    if (code === "23503") fail(categoriesPath, "Choose a valid parent category.");
    fail(categoriesPath, "Could not create the category.");
  }

  revalidateCatalogue();
  redirect(`${categoriesPath}?saved=created`);
}

export async function updateCategoryAction(categoryId: string, formData: FormData): Promise<void> {
  await requireEditor();

  const id = readId(categoryId);
  if (!id) fail(categoriesPath, "Unknown category.");

  const name = stringValue(formData.get("name"));
  const parsed = categorySchema.safeParse({
    name,
    slug: stringValue(formData.get("slug")) || slugify(name),
    parentId: stringValue(formData.get("parentId")),
    description: stringValue(formData.get("description")),
    imageUrl: stringValue(formData.get("imageUrl")),
    displayOrder: stringValue(formData.get("displayOrder")) || "0",
    isActive: checkboxValue(formData.get("isActive")),
  });

  if (!parsed.success) fail(categoryPath(id), firstError(fieldErrors(parsed.error)));

  if (parsed.data.parentId === id) {
    fail(categoryPath(id), "A category cannot be its own parent.");
  }

  if (parsed.data.parentId) {
    const descendants = await getPrismaClient().$queryRaw<Array<{ id: string }>>`
      with recursive descendants as (
        select id from public.product_categories where parent_id = ${id}::uuid
        union all
        select c.id
        from public.product_categories c
        join descendants d on c.parent_id = d.id
      )
      select id from descendants where id = ${parsed.data.parentId}::uuid limit 1
    `;
    if (descendants.length > 0) {
      fail(categoryPath(id), "Move the category outside its own subcategories first.");
    }
  }

  try {
    await getPrismaClient().$executeRaw`
      update public.product_categories
         set name = ${parsed.data.name},
             slug = ${parsed.data.slug},
             parent_id = nullif(${parsed.data.parentId}, '')::uuid,
             description = nullif(${parsed.data.description}, ''),
             image_url = nullif(${parsed.data.imageUrl}, ''),
             display_order = ${Number(parsed.data.displayOrder)},
             is_active = ${parsed.data.isActive},
             updated_at = now()
       where id = ${id}::uuid
    `;
  } catch (caught) {
    const code = errorCode(caught);
    if (code === "23505") fail(categoryPath(id), "That category slug is already in use.");
    if (code === "23503") fail(categoryPath(id), "Choose a valid parent category.");
    fail(categoryPath(id), "Could not save the category.");
  }

  revalidateCatalogue(categoryPath(id));
  redirect(`${categoryPath(id)}?saved=category`);
}

export async function deleteCategoryAction(categoryId: string): Promise<void> {
  await requireEditor();

  const id = readId(categoryId);
  if (!id) fail(categoriesPath, "Unknown category.");

  const usage = await getPrismaClient().$queryRaw<
    Array<{ children: number; products: number }>
  >`
    select
      (select count(*)::int from public.product_categories where parent_id = ${id}::uuid) as children,
      (select count(*)::int from public.products where category_id = ${id}::uuid) as products
  `;

  if ((usage[0]?.children ?? 0) > 0) {
    fail(categoryPath(id), "Move or delete the subcategories before deleting this category.");
  }
  if ((usage[0]?.products ?? 0) > 0) {
    fail(categoryPath(id), "Move the products to another category before deleting this one.");
  }

  try {
    await getPrismaClient().$executeRaw`
      delete from public.product_categories where id = ${id}::uuid
    `;
  } catch {
    fail(categoryPath(id), "Could not delete the category because it is still in use.");
  }

  revalidateCatalogue();
  redirect(`${categoriesPath}?saved=deleted`);
}

/* -------------------------------------------------------------------------- */
/* Measurement units                                                          */
/* -------------------------------------------------------------------------- */

function parseUnit(formData: FormData) {
  return categoryUnitSchema.safeParse({
    name: stringValue(formData.get("name")),
    symbol: stringValue(formData.get("symbol")),
    unitType: stringValue(formData.get("unitType")),
    baseUnitSymbol: stringValue(formData.get("baseUnitSymbol")),
    conversionToBase: stringValue(formData.get("conversionToBase")),
    isActive: checkboxValue(formData.get("isActive")),
  });
}

function unitFailure(caught: unknown, fallbackPath: string): never {
  const code = errorCode(caught);
  if (code === "23505") fail(fallbackPath, "A unit with that name or symbol already exists.");
  if (code === "23503") fail(fallbackPath, "This unit is used by a category option.");
  fail(fallbackPath, "Could not save the measurement unit.");
}

export async function createUnitAction(formData: FormData): Promise<void> {
  await requireEditor();

  const parsed = parseUnit(formData);
  if (!parsed.success) fail(unitsPath, firstError(fieldErrors(parsed.error)));

  try {
    await getPrismaClient().$executeRaw`
      insert into public.quantity_units (
        name, symbol, unit_type, base_unit_symbol, conversion_to_base, is_active
      )
      values (
        ${parsed.data.name},
        ${parsed.data.symbol},
        ${parsed.data.unitType},
        nullif(${parsed.data.baseUnitSymbol}, ''),
        nullif(${parsed.data.conversionToBase}, '')::numeric,
        ${parsed.data.isActive}
      )
    `;
  } catch (caught) {
    unitFailure(caught, unitsPath);
  }

  revalidateCatalogue();
  redirect(`${unitsPath}?saved=created`);
}

export async function updateUnitAction(unitId: string, formData: FormData): Promise<void> {
  await requireEditor();

  const id = readId(unitId);
  if (!id) fail(unitsPath, "Unknown measurement unit.");

  const parsed = parseUnit(formData);
  if (!parsed.success) fail(unitsPath, firstError(fieldErrors(parsed.error)));

  try {
    await getPrismaClient().$executeRaw`
      update public.quantity_units
         set name = ${parsed.data.name},
             symbol = ${parsed.data.symbol},
             unit_type = ${parsed.data.unitType},
             base_unit_symbol = nullif(${parsed.data.baseUnitSymbol}, ''),
             conversion_to_base = nullif(${parsed.data.conversionToBase}, '')::numeric,
             is_active = ${parsed.data.isActive}
       where id = ${id}::uuid
    `;
  } catch (caught) {
    unitFailure(caught, unitsPath);
  }

  revalidateCatalogue();
  redirect(`${unitsPath}?saved=updated`);
}

export async function deleteUnitAction(unitId: string): Promise<void> {
  await requireEditor();

  const id = readId(unitId);
  if (!id) fail(unitsPath, "Unknown measurement unit.");

  try {
    await getPrismaClient().$executeRaw`
      delete from public.quantity_units where id = ${id}::uuid
    `;
  } catch (caught) {
    unitFailure(caught, unitsPath);
  }

  revalidateCatalogue();
  redirect(`${unitsPath}?saved=deleted`);
}

/* -------------------------------------------------------------------------- */
/* Packaging types                                                            */
/* -------------------------------------------------------------------------- */

function parsePackaging(formData: FormData) {
  return packagingTypeSchema.safeParse({
    name: stringValue(formData.get("name")),
    description: stringValue(formData.get("description")),
    isReusable: checkboxValue(formData.get("isReusable")),
    isActive: checkboxValue(formData.get("isActive")),
  });
}

function packagingFailure(caught: unknown): never {
  const code = errorCode(caught);
  if (code === "23505") fail(packagingPath, "A packaging type with that name already exists.");
  if (code === "23503") fail(packagingPath, "This packaging type is used by a category option.");
  fail(packagingPath, "Could not save the packaging type.");
}

export async function createPackagingAction(formData: FormData): Promise<void> {
  await requireEditor();

  const parsed = parsePackaging(formData);
  if (!parsed.success) fail(packagingPath, firstError(fieldErrors(parsed.error)));

  try {
    await getPrismaClient().$executeRaw`
      insert into public.packaging_types (name, description, is_reusable, is_active)
      values (
        ${parsed.data.name},
        nullif(${parsed.data.description}, ''),
        ${parsed.data.isReusable},
        ${parsed.data.isActive}
      )
    `;
  } catch (caught) {
    packagingFailure(caught);
  }

  revalidateCatalogue();
  redirect(`${packagingPath}?saved=created`);
}

export async function updatePackagingAction(
  packagingId: string,
  formData: FormData,
): Promise<void> {
  await requireEditor();

  const id = readId(packagingId);
  if (!id) fail(packagingPath, "Unknown packaging type.");

  const parsed = parsePackaging(formData);
  if (!parsed.success) fail(packagingPath, firstError(fieldErrors(parsed.error)));

  try {
    await getPrismaClient().$executeRaw`
      update public.packaging_types
         set name = ${parsed.data.name},
             description = nullif(${parsed.data.description}, ''),
             is_reusable = ${parsed.data.isReusable},
             is_active = ${parsed.data.isActive}
       where id = ${id}::uuid
    `;
  } catch (caught) {
    packagingFailure(caught);
  }

  revalidateCatalogue();
  redirect(`${packagingPath}?saved=updated`);
}

export async function deletePackagingAction(packagingId: string): Promise<void> {
  await requireEditor();

  const id = readId(packagingId);
  if (!id) fail(packagingPath, "Unknown packaging type.");

  try {
    await getPrismaClient().$executeRaw`
      delete from public.packaging_types where id = ${id}::uuid
    `;
  } catch (caught) {
    packagingFailure(caught);
  }

  revalidateCatalogue();
  redirect(`${packagingPath}?saved=deleted`);
}

/* -------------------------------------------------------------------------- */
/* Category options (unit + packaging combinations)                           */
/* -------------------------------------------------------------------------- */

function parseOption(formData: FormData) {
  return categoryOptionSchema.safeParse({
    quantityUnitId: stringValue(formData.get("quantityUnitId")),
    packagingTypeId: stringValue(formData.get("packagingTypeId")),
    defaultPackSize: stringValue(formData.get("defaultPackSize")),
    minimumOrderQuantity: stringValue(formData.get("minimumOrderQuantity")) || "1",
    isDefault: checkboxValue(formData.get("isDefault")),
    isActive: checkboxValue(formData.get("isActive")),
  });
}

function optionFailure(caught: unknown, path: string): never {
  const code = errorCode(caught);
  if (code === "23505") fail(path, "That unit and packaging combination already exists here.");
  if (code === "23503") fail(path, "Choose a valid unit and packaging type.");
  fail(path, "Could not save the supply option.");
}

export async function createCategoryOptionAction(
  categoryId: string,
  formData: FormData,
): Promise<void> {
  await requireEditor();

  const id = readId(categoryId);
  if (!id) fail(categoriesPath, "Unknown category.");

  const parsed = parseOption(formData);
  if (!parsed.success) fail(categoryPath(id), firstError(fieldErrors(parsed.error)));

  try {
    await getPrismaClient().$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.$executeRaw`
          update public.category_options set is_default = false where category_id = ${id}::uuid
        `;
      }
      await tx.$executeRaw`
        insert into public.category_options (
          category_id, quantity_unit_id, packaging_type_id,
          default_pack_size, minimum_order_quantity, is_default, is_active
        )
        values (
          ${id}::uuid,
          ${parsed.data.quantityUnitId}::uuid,
          ${parsed.data.packagingTypeId}::uuid,
          nullif(${parsed.data.defaultPackSize}, '')::numeric,
          ${parsed.data.minimumOrderQuantity}::numeric,
          ${parsed.data.isDefault},
          ${parsed.data.isActive}
        )
      `;
    });
  } catch (caught) {
    optionFailure(caught, categoryPath(id));
  }

  revalidateCatalogue(categoryPath(id));
  redirect(`${categoryPath(id)}?saved=options`);
}

export async function updateCategoryOptionAction(
  categoryId: string,
  optionId: string,
  formData: FormData,
): Promise<void> {
  await requireEditor();

  const category = readId(categoryId);
  const option = readId(optionId);
  if (!category || !option) fail(categoriesPath, "Unknown supply option.");

  const parsed = parseOption(formData);
  if (!parsed.success) fail(categoryPath(category), firstError(fieldErrors(parsed.error)));

  try {
    await getPrismaClient().$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.$executeRaw`
          update public.category_options
             set is_default = false
           where category_id = ${category}::uuid
             and id <> ${option}::uuid
        `;
      }
      await tx.$executeRaw`
        update public.category_options
           set quantity_unit_id = ${parsed.data.quantityUnitId}::uuid,
               packaging_type_id = ${parsed.data.packagingTypeId}::uuid,
               default_pack_size = nullif(${parsed.data.defaultPackSize}, '')::numeric,
               minimum_order_quantity = ${parsed.data.minimumOrderQuantity}::numeric,
               is_default = ${parsed.data.isDefault},
               is_active = ${parsed.data.isActive}
         where id = ${option}::uuid
           and category_id = ${category}::uuid
      `;
    });
  } catch (caught) {
    optionFailure(caught, categoryPath(category));
  }

  revalidateCatalogue(categoryPath(category));
  redirect(`${categoryPath(category)}?saved=options`);
}

export async function deleteCategoryOptionAction(
  categoryId: string,
  optionId: string,
): Promise<void> {
  await requireEditor();

  const category = readId(categoryId);
  const option = readId(optionId);
  if (!category || !option) fail(categoriesPath, "Unknown supply option.");

  try {
    await getPrismaClient().$executeRaw`
      delete from public.category_options
      where id = ${option}::uuid
        and category_id = ${category}::uuid
    `;
  } catch {
    fail(categoryPath(category), "Could not delete the supply option.");
  }

  revalidateCatalogue(categoryPath(category));
  redirect(`${categoryPath(category)}?saved=options`);
}
