import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { countAdmins, getCurrentAdmin } from "@/server/admin/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function AdminLoginPage() {
  if ((await countAdmins()) === 0) redirect("/admin/setup/");

  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin/");

  return (
    <>
      <p className="admin-eyebrow">Admin access</p>
      <h2>Sign in</h2>
      <p className="admin-auth__lede">Use the username and password issued by the account owner.</p>
      <LoginForm />
    </>
  );
}
