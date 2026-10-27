"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireEditor } from "@/server/admin/auth";
import {
  customerEnquirySchema,
  customerEnquiryStatusSchema,
  fieldErrors,
  stringValue,
  supplierEnquiryStatusSchema,
} from "@/server/admin/validation";
import { getPrismaClient } from "@/server/prisma";

function firstError(errors: Record<string, string>): string {
  return Object.values(errors)[0] ?? "Check the form and try again.";
}

export async function createCustomerEnquiryAction(formData: FormData): Promise<void> {
  await requireEditor();

  const parsed = customerEnquirySchema.safeParse({
    fullName: stringValue(formData.get("fullName")),
    phone: stringValue(formData.get("phone")),
    email: stringValue(formData.get("email")),
    productId: stringValue(formData.get("productId")),
    quantityKg: stringValue(formData.get("quantityKg")),
    source: stringValue(formData.get("source")),
    message: stringValue(formData.get("message")),
  });

  if (!parsed.success) {
    const message = firstError(fieldErrors(parsed.error));
    redirect(`/admin/enquiries/new/?error=${encodeURIComponent(message)}`);
  }

  let error: string | null = null;
  try {
    await getPrismaClient().$executeRaw`
      insert into public.customer_enquiries (
        full_name, phone, email, product_id, quantity_kg, source, message
      )
      values (
        ${parsed.data.fullName},
        ${parsed.data.phone},
        nullif(${parsed.data.email ?? ""}, ''),
        ${parsed.data.productId ?? null}::uuid,
        ${parsed.data.quantityKg || null}::numeric,
        ${parsed.data.source},
        nullif(${parsed.data.message}, '')
      )
    `;
  } catch {
    error = "Could not save the enquiry.";
  }

  if (error) redirect(`/admin/enquiries/new/?error=${encodeURIComponent(error)}`);

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/");
  redirect("/admin/enquiries/?tab=customers&saved=created");
}

async function updateCustomerStatus(id: string, status: string): Promise<void> {
  await getPrismaClient().$executeRaw`
    update public.customer_enquiries
       set status = ${status},
           updated_at = now()
     where id = ${id}::uuid
  `;
}

export async function updateCustomerEnquiryStatusAction(formData: FormData): Promise<void> {
  await requireEditor();

  const parsed = customerEnquiryStatusSchema.safeParse({
    id: stringValue(formData.get("id")),
    status: stringValue(formData.get("status")),
  });

  if (!parsed.success) {
    redirect("/admin/enquiries/?tab=customers&error=Unknown%20enquiry.");
  }

  await updateCustomerStatus(parsed.data.id, parsed.data.status);

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/");
  redirect("/admin/enquiries/?tab=customers&saved=status");
}

export async function updateSupplierEnquiryStatusAction(formData: FormData): Promise<void> {
  await requireEditor();

  const parsed = supplierEnquiryStatusSchema.safeParse({
    id: stringValue(formData.get("id")),
    status: stringValue(formData.get("status")),
  });

  if (!parsed.success) {
    redirect("/admin/enquiries/?tab=suppliers&error=Unknown%20enquiry.");
  }

  await getPrismaClient().$executeRaw`
    update public.supplier_enquiries
       set status = ${parsed.data.status}
     where id = ${parsed.data.id}::uuid
  `;

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/");
  redirect("/admin/enquiries/?tab=suppliers&saved=status");
}
