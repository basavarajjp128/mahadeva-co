import "server-only";

import { getPrismaClient } from "@/server/prisma";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  productCount: number;
  optionCount: number;
  updatedAt: Date;
};

export type CategoryChoice = {
  id: string;
  name: string;
  parentName: string | null;
  isActive: boolean;
};

export type AdminUnit = {
  id: string;
  name: string;
  symbol: string;
  unitType: string;
  baseUnitSymbol: string | null;
  conversionToBase: string | null;
  isActive: boolean;
  optionCount: number;
};

export type AdminPackaging = {
  id: string;
  name: string;
  description: string | null;
  isReusable: boolean;
  isActive: boolean;
  optionCount: number;
};

export type AdminCategoryOption = {
  id: string;
  categoryId: string;
  quantityUnitId: string;
  unitName: string;
  unitSymbol: string;
  packagingTypeId: string;
  packagingName: string;
  defaultPackSize: string | null;
  minimumOrderQuantity: string;
  isDefault: boolean;
  isActive: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  parent_name: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  product_count: number;
  option_count: number;
  updated_at: Date;
};

type UnitRow = {
  id: string;
  name: string;
  symbol: string;
  unit_type: string;
  base_unit_symbol: string | null;
  conversion_to_base: string | null;
  is_active: boolean;
  option_count: number;
};

type PackagingRow = {
  id: string;
  name: string;
  description: string | null;
  is_reusable: boolean;
  is_active: boolean;
  option_count: number;
};

type OptionRow = {
  id: string;
  category_id: string;
  quantity_unit_id: string;
  unit_name: string;
  unit_symbol: string;
  packaging_type_id: string;
  packaging_name: string;
  default_pack_size: string | null;
  minimum_order_quantity: string;
  is_default: boolean;
  is_active: boolean;
};

function toCategory(row: CategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    parentName: row.parent_name,
    description: row.description,
    imageUrl: row.image_url,
    isActive: row.is_active,
    displayOrder: row.display_order,
    productCount: row.product_count,
    optionCount: row.option_count,
    updatedAt: row.updated_at,
  };
}

function toUnit(row: UnitRow): AdminUnit {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    unitType: row.unit_type,
    baseUnitSymbol: row.base_unit_symbol,
    conversionToBase: row.conversion_to_base,
    isActive: row.is_active,
    optionCount: row.option_count,
  };
}

function toPackaging(row: PackagingRow): AdminPackaging {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isReusable: row.is_reusable,
    isActive: row.is_active,
    optionCount: row.option_count,
  };
}

function toOption(row: OptionRow): AdminCategoryOption {
  return {
    id: row.id,
    categoryId: row.category_id,
    quantityUnitId: row.quantity_unit_id,
    unitName: row.unit_name,
    unitSymbol: row.unit_symbol,
    packagingTypeId: row.packaging_type_id,
    packagingName: row.packaging_name,
    defaultPackSize: row.default_pack_size,
    minimumOrderQuantity: row.minimum_order_quantity,
    isDefault: row.is_default,
    isActive: row.is_active,
  };
}

export async function listCategories(): Promise<AdminCategory[]> {
  const rows = await getPrismaClient().$queryRaw<CategoryRow[]>`
    select
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      p.name as parent_name,
      c.description,
      c.image_url,
      c.is_active,
      c.display_order,
      c.updated_at,
      (select count(*)::int from public.products pr where pr.category_id = c.id) as product_count,
      (select count(*)::int from public.category_options co where co.category_id = c.id) as option_count
    from public.product_categories c
    left join public.product_categories p on p.id = c.parent_id
    order by coalesce(p.name, c.name) asc, (c.parent_id is not null) asc, c.display_order asc, c.name asc
  `;
  return rows.map(toCategory);
}

export async function getCategory(id: string): Promise<AdminCategory | null> {
  const rows = await getPrismaClient().$queryRaw<CategoryRow[]>`
    select
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      p.name as parent_name,
      c.description,
      c.image_url,
      c.is_active,
      c.display_order,
      c.updated_at,
      (select count(*)::int from public.products pr where pr.category_id = c.id) as product_count,
      (select count(*)::int from public.category_options co where co.category_id = c.id) as option_count
    from public.product_categories c
    left join public.product_categories p on p.id = c.parent_id
    where c.id = ${id}::uuid
    limit 1
  `;
  return rows[0] ? toCategory(rows[0]) : null;
}

export async function listCategoryChoices(): Promise<CategoryChoice[]> {
  const rows = await getPrismaClient().$queryRaw<
    Array<{ id: string; name: string; parent_name: string | null; is_active: boolean }>
  >`
    select c.id, c.name, p.name as parent_name, c.is_active
    from public.product_categories c
    left join public.product_categories p on p.id = c.parent_id
    order by coalesce(p.name, c.name) asc, c.parent_id nulls first, c.display_order asc, c.name asc
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentName: row.parent_name,
    isActive: row.is_active,
  }));
}

export async function listUnits(): Promise<AdminUnit[]> {
  const rows = await getPrismaClient().$queryRaw<UnitRow[]>`
    select
      u.id,
      u.name,
      u.symbol,
      u.unit_type,
      u.base_unit_symbol,
      u.conversion_to_base::text as conversion_to_base,
      u.is_active,
      (select count(*)::int from public.category_options co where co.quantity_unit_id = u.id) as option_count
    from public.quantity_units u
    order by u.unit_type asc, u.name asc
  `;
  return rows.map(toUnit);
}

export async function listPackagingTypes(): Promise<AdminPackaging[]> {
  const rows = await getPrismaClient().$queryRaw<PackagingRow[]>`
    select
      p.id,
      p.name,
      p.description,
      p.is_reusable,
      p.is_active,
      (select count(*)::int from public.category_options co where co.packaging_type_id = p.id) as option_count
    from public.packaging_types p
    order by p.name asc
  `;
  return rows.map(toPackaging);
}

export async function listCategoryOptions(categoryId: string): Promise<AdminCategoryOption[]> {
  const rows = await getPrismaClient().$queryRaw<OptionRow[]>`
    select
      co.id,
      co.category_id,
      co.quantity_unit_id,
      u.name as unit_name,
      u.symbol as unit_symbol,
      co.packaging_type_id,
      p.name as packaging_name,
      co.default_pack_size::text as default_pack_size,
      co.minimum_order_quantity::text as minimum_order_quantity,
      co.is_default,
      co.is_active
    from public.category_options co
    join public.quantity_units u on u.id = co.quantity_unit_id
    join public.packaging_types p on p.id = co.packaging_type_id
    where co.category_id = ${categoryId}::uuid
    order by co.is_default desc, u.unit_type asc, u.name asc, p.name asc
  `;
  return rows.map(toOption);
}
