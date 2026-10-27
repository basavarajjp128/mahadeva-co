import "server-only";

import type { CustomerEnquiryStatus, SupplierEnquiryStatus } from "@/server/admin/constants";
import { getPrismaClient } from "@/server/prisma";

type Numeric = string | number | null;

function toNumber(value: Numeric): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
  updatedAt: Date;
  price: number | null;
  stockKg: number | null;
  lowStockThresholdKg: number | null;
};

type ProductSummaryRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  is_active: boolean;
  updated_at: Date;
  price: Numeric;
  stock_kg: Numeric;
  low_stock_threshold_kg: Numeric;
};

function toProductSummary(row: ProductSummaryRow): ProductSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    isActive: row.is_active,
    updatedAt: row.updated_at,
    price: toNumber(row.price),
    stockKg: toNumber(row.stock_kg),
    lowStockThresholdKg: toNumber(row.low_stock_threshold_kg),
  };
}

export async function listProducts(search = ""): Promise<ProductSummary[]> {
  const rows = await getPrismaClient().$queryRaw<ProductSummaryRow[]>`
    select
      p.id,
      p.name,
      p.slug,
      p.category,
      p.is_active,
      p.updated_at,
      current_price.price_per_kg::text as price,
      i.stock_kg::text as stock_kg,
      i.low_stock_threshold_kg::text as low_stock_threshold_kg
    from public.products p
    left join public.product_inventory i on i.product_id = p.id
    left join lateral (
      select pp.price_per_kg
      from public.product_prices pp
      where pp.product_id = p.id
        and (pp.valid_until is null or pp.valid_until > now())
      order by pp.valid_from desc
      limit 1
    ) current_price on true
    where (
      ${search} = ''
      or p.name ilike ${`%${search}%`}
      or p.slug ilike ${`%${search}%`}
      or p.category ilike ${`%${search}%`}
    )
    order by p.name asc
  `;
  return rows.map(toProductSummary);
}

export type ProductGrade = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type PriceHistoryEntry = {
  id: string;
  pricePerKg: number;
  currency: string;
  validFrom: Date;
  validUntil: Date | null;
};

export type ProductDetail = ProductSummary & {
  description: string | null;
  createdAt: Date;
  currency: string | null;
  imagePath: string | null;
  imageAlt: string | null;
  isSample: boolean;
  grades: ProductGrade[];
  priceHistory: PriceHistoryEntry[];
  purchaseRule: {
    minQuantityKg: number;
    directCheckoutMaxKg: number | null;
    requiresEnquiryAbove: boolean;
  } | null;
};

type ProductDetailRow = ProductSummaryRow & {
  description: string | null;
  created_at: Date;
  price_currency: string | null;
  image_path: string | null;
  image_alt: string | null;
  is_sample: boolean;
};

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const prisma = getPrismaClient();

  const rows = await prisma.$queryRaw<ProductDetailRow[]>`
    select
      p.id,
      p.name,
      p.slug,
      p.category,
      p.is_active,
      p.created_at,
      p.updated_at,
      p.description,
      p.image_path,
      p.image_alt,
      p.is_sample,
      current_price.currency as price_currency,
      current_price.price_per_kg::text as price,
      i.stock_kg::text as stock_kg,
      i.low_stock_threshold_kg::text as low_stock_threshold_kg
    from public.products p
    left join public.product_inventory i on i.product_id = p.id
    left join lateral (
      select pp.price_per_kg, pp.currency
      from public.product_prices pp
      where pp.product_id = p.id
        and (pp.valid_until is null or pp.valid_until > now())
      order by pp.valid_from desc
      limit 1
    ) current_price on true
    where p.id = ${id}::uuid
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  const [gradeRows, priceRows, ruleRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{ id: string; name: string; description: string | null; is_active: boolean }>
    >`
      select id, name, description, is_active
      from public.product_grades
      where product_id = ${id}::uuid
      order by name asc
    `,
    prisma.$queryRaw<
      Array<{
        id: string;
        price_per_kg: Numeric;
        currency: string;
        valid_from: Date;
        valid_until: Date | null;
      }>
    >`
      select id, price_per_kg::text as price_per_kg, currency, valid_from, valid_until
      from public.product_prices
      where product_id = ${id}::uuid
      order by valid_from desc
      limit 6
    `,
    prisma.$queryRaw<
      Array<{
        min_quantity_kg: Numeric;
        direct_checkout_max_kg: Numeric;
        requires_enquiry_above: boolean;
      }>
    >`
      select
        min_quantity_kg::text as min_quantity_kg,
        direct_checkout_max_kg::text as direct_checkout_max_kg,
        requires_enquiry_above
      from public.product_purchase_rules
      where product_id = ${id}::uuid
      limit 1
    `,
  ]);

  const rule = ruleRows[0];

  return {
    ...toProductSummary(row),
    description: row.description,
    createdAt: row.created_at,
    currency: row.price_currency ?? "INR",
    imagePath: row.image_path,
    imageAlt: row.image_alt,
    isSample: row.is_sample,
    grades: gradeRows.map((grade) => ({
      id: grade.id,
      name: grade.name,
      description: grade.description,
      isActive: grade.is_active,
    })),
    priceHistory: priceRows.map((price) => ({
      id: price.id,
      pricePerKg: toNumber(price.price_per_kg) ?? 0,
      currency: price.currency,
      validFrom: price.valid_from,
      validUntil: price.valid_until,
    })),
    purchaseRule: rule
      ? {
          minQuantityKg: toNumber(rule.min_quantity_kg) ?? 0,
          directCheckoutMaxKg: toNumber(rule.direct_checkout_max_kg),
          requiresEnquiryAbove: rule.requires_enquiry_above,
        }
      : null,
  };
}

export type InventoryItem = ProductSummary & {
  inventoryUpdatedAt: Date | null;
};

export async function listInventory(): Promise<InventoryItem[]> {
  const rows = await getPrismaClient().$queryRaw<
    Array<ProductSummaryRow & { inventory_updated_at: Date | null }>
  >`
    select
      p.id,
      p.name,
      p.slug,
      p.category,
      p.is_active,
      p.updated_at,
      current_price.price_per_kg::text as price,
      i.stock_kg::text as stock_kg,
      i.low_stock_threshold_kg::text as low_stock_threshold_kg,
      i.updated_at as inventory_updated_at
    from public.products p
    left join public.product_inventory i on i.product_id = p.id
    left join lateral (
      select pp.price_per_kg
      from public.product_prices pp
      where pp.product_id = p.id
        and (pp.valid_until is null or pp.valid_until > now())
      order by pp.valid_from desc
      limit 1
    ) current_price on true
    order by p.name asc
  `;

  return rows.map((row) => ({
    ...toProductSummary(row),
    inventoryUpdatedAt: row.inventory_updated_at,
  }));
}

export type CustomerEnquiryRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  quantityKg: number | null;
  message: string | null;
  source: string;
  status: CustomerEnquiryStatus;
  createdAt: Date;
  productName: string | null;
  productSlug: string | null;
};

type CustomerEnquiryDbRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  quantity_kg: Numeric;
  message: string | null;
  source: string;
  status: CustomerEnquiryStatus;
  created_at: Date;
  product_name: string | null;
  product_slug: string | null;
};

export async function listCustomerEnquiries(
  status: CustomerEnquiryStatus | "",
  limit = 200,
): Promise<CustomerEnquiryRow[]> {
  const rows = await getPrismaClient().$queryRaw<CustomerEnquiryDbRow[]>`
    select
      e.id,
      e.full_name,
      e.phone,
      e.email,
      e.quantity_kg::text as quantity_kg,
      e.message,
      e.source,
      e.status,
      e.created_at,
      p.name as product_name,
      p.slug as product_slug
    from public.customer_enquiries e
    left join public.products p on p.id = e.product_id
    where (${status} = '' or e.status = ${status})
    order by e.created_at desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    quantityKg: toNumber(row.quantity_kg),
    message: row.message,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
    productName: row.product_name,
    productSlug: row.product_slug,
  }));
}

export type SupplierEnquiryRow = {
  id: string;
  farmerName: string;
  phone: string;
  villageTown: string;
  district: string;
  quantityKg: number;
  status: SupplierEnquiryStatus;
  notes: string | null;
  createdAt: Date;
  productName: string | null;
  gradeName: string | null;
};

type SupplierEnquiryDbRow = {
  id: string;
  farmer_name: string;
  phone: string;
  village_town: string;
  district: string;
  quantity_kg: Numeric;
  status: SupplierEnquiryStatus;
  notes: string | null;
  created_at: Date;
  product_name: string | null;
  grade_name: string | null;
};

export async function listSupplierEnquiries(
  status: SupplierEnquiryStatus | "",
  limit = 200,
): Promise<SupplierEnquiryRow[]> {
  const rows = await getPrismaClient().$queryRaw<SupplierEnquiryDbRow[]>`
    select
      e.id,
      f.full_name as farmer_name,
      f.phone,
      f.village_town,
      f.district,
      e.quantity_kg::text as quantity_kg,
      e.status,
      e.notes,
      e.created_at,
      p.name as product_name,
      g.name as grade_name
    from public.supplier_enquiries e
    join public.farmers f on f.id = e.farmer_id
    left join public.products p on p.id = e.product_id
    left join public.product_grades g on g.id = e.grade_id
    where (${status} = '' or e.status = ${status})
    order by e.created_at desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    farmerName: row.farmer_name,
    phone: row.phone,
    villageTown: row.village_town,
    district: row.district,
    quantityKg: toNumber(row.quantity_kg) ?? 0,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    productName: row.product_name,
    gradeName: row.grade_name,
  }));
}

export type DashboardSnapshot = {
  productsTotal: number;
  productsActive: number;
  stockKg: number;
  lowStockCount: number;
  customerNew: number;
  supplierNew: number;
  recentCustomers: CustomerEnquiryRow[];
  recentSuppliers: SupplierEnquiryRow[];
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const counts = await getPrismaClient().$queryRaw<
    Array<{
      products_total: number;
      products_active: number;
      stock_kg: Numeric;
      low_stock_count: number;
      customer_new: number;
      supplier_new: number;
    }>
  >`
    select
      (select count(*)::int from public.products) as products_total,
      (select count(*)::int from public.products where is_active = true) as products_active,
      (select coalesce(sum(stock_kg), 0)::text from public.product_inventory) as stock_kg,
      (
        select count(*)::int
        from public.product_inventory i
        join public.products p on p.id = i.product_id
        where i.stock_kg <= i.low_stock_threshold_kg
      ) as low_stock_count,
      (select count(*)::int from public.customer_enquiries where status = 'new') as customer_new,
      (select count(*)::int from public.supplier_enquiries where status = 'new') as supplier_new
  `;

  const [recentCustomers, recentSuppliers] = await Promise.all([
    listCustomerEnquiries("", 4),
    listSupplierEnquiries("", 4),
  ]);

  const row = counts[0];

  return {
    productsTotal: row?.products_total ?? 0,
    productsActive: row?.products_active ?? 0,
    stockKg: toNumber(row?.stock_kg ?? null) ?? 0,
    lowStockCount: row?.low_stock_count ?? 0,
    customerNew: row?.customer_new ?? 0,
    supplierNew: row?.supplier_new ?? 0,
    recentCustomers,
    recentSuppliers,
  };
}

export type ProductOption = { id: string; name: string };

export async function listProductOptions(): Promise<ProductOption[]> {
  return getPrismaClient().$queryRaw<ProductOption[]>`
    select id, name
    from public.products
    order by name asc
  `;
}

export async function getEnquiryCounts(): Promise<{ customers: number; suppliers: number }> {
  const rows = await getPrismaClient().$queryRaw<Array<{ customers: number; suppliers: number }>>`
    select
      (select count(*)::int from public.customer_enquiries) as customers,
      (select count(*)::int from public.supplier_enquiries) as suppliers
  `;
  return { customers: rows[0]?.customers ?? 0, suppliers: rows[0]?.suppliers ?? 0 };
}
