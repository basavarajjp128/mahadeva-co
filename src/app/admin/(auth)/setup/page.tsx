import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminAlert } from "@/components/admin/ui";
import { countAdmins, hasSupabaseAdminConfig } from "@/server/admin/auth";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "First-time setup",
};

export default async function AdminSetupPage() {
  if ((await countAdmins()) > 0) redirect("/admin/login/");

  const supabaseReady = await hasSupabaseAdminConfig();

  return (
    <>
      <p className="admin-eyebrow">First-time setup</p>
      <h2>Create the owner account</h2>
      <p className="admin-auth__lede">
        This page is available only while no administrator exists. The account is linked to a
        Supabase auth user, but signs in with the username and password you choose here.
      </p>

      {supabaseReady ? null : (
        <AdminAlert variant="warning">
          Set <code>SUPABASE_URL</code> and <code>SUPABASE_SECRET_KEY</code> in the server
          environment before creating the account.
        </AdminAlert>
      )}

      <SetupForm />
    </>
  );
}
