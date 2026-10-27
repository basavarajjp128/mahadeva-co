"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireEditor } from "@/server/admin/auth";
import { fieldErrors, inventorySchema, stringValue } from "@/server/admin/validation";
import { getPrismaClient } from "@/server/prisma";

function firstError(errors: Record<string, string>): string {
  return Object.values(errors)[0] ?? "Check the form and try again.";
}

export async function updateInventoryAction(productId: string, formData: FormData): Promise<void> {
  const admin = await requireEditor();

  const id = z.string().uuid().safeParse(productId);
  if (!id.success) redirect("/admin/inventory/?error=Unknown%20product.");

  const parsed = inventorySchema.safeParse({
    stockKg: stringValue(formData.get("stockKg")),
    lowStockThresholdKg: stringValue(formData.get("lowStockThresholdKg")),
  });

  if (!parsed.success) {
    redirect(
      `/admin/inventory/?error=${encodeURIComponent(firstError(fieldErrors(parsed.error)))}`,
    );
  }

  let error: string | null = null;
  try {
    await getPrismaClient().$executeRaw`
      insert into public.product_inventory (
        product_id, stock_kg, low_stock_threshold_kg, updated_by_admin_id, updated_at
      )
      values (
        ${productId}::uuid,
        ${parsed.data.stockKg}::numeric,
        ${parsed.data.lowStockThresholdKg}::numeric,
        ${admin.id}::uuid,
        now()
      )
      on conflict (product_id) do update
        set stock_kg = excluded.stock_kg,
            low_stock_threshold_kg = excluded.low_stock_threshold_kg,
            updated_by_admin_id = excluded.updated_by_admin_id,
            updated_at = now()
    `;
  } catch {
    error = "Could not save the stock level.";
  }

  if (error) redirect(`/admin/inventory/?error=${encodeURIComponent(error)}`);

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/");
  redirect(`/admin/inventory/?saved=${encodeURIComponent(id.data)}`);
}
