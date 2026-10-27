import "server-only";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAdminSession } from "@/server/admin/session";
import type { AdminRole } from "@/server/admin/session-token";
import { getPrismaClient } from "@/server/prisma";

const BCRYPT_COST = 12;
// Used to keep failed lookups roughly as slow as failed password checks.
const DUMMY_HASH = "$2b$12$Pk5NaW4sEgvwc0lOVf0Iz.hnxPPL5htzoKEIsbpUbwcNHjOqwWGLW";

export type AdminAccount = {
  id: string;
  fullName: string;
  username: string;
  role: AdminRole;
  email: string | null;
  phone: string;
  mustChangePassword: boolean;
};

type AdminRow = {
  id: string;
  full_name: string;
  username: string;
  role: AdminRole;
  email: string | null;
  phone: string;
  password_hash: string;
  must_change_password: boolean;
};

function toAccount(row: AdminRow): AdminAccount {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    role: row.role,
    email: row.email,
    phone: row.phone,
    mustChangePassword: row.must_change_password,
  };
}

export function canEdit(role: AdminRole): boolean {
  return role !== "viewer";
}

export async function countAdmins(): Promise<number> {
  const rows = await getPrismaClient().$queryRaw<Array<{ count: number }>>`
    select count(*)::int as count from public.admin_users
  `;
  return rows[0]?.count ?? 0;
}

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<AdminAccount | null> {
  const rows = await getPrismaClient().$queryRaw<AdminRow[]>`
    select id, full_name, username, role, email, phone, password_hash, must_change_password
    from public.admin_users
    where lower(username) = lower(${username})
      and is_active = true
    limit 1
  `;

  const row = rows[0];
  if (!row) {
    await compare(password, DUMMY_HASH);
    return null;
  }

  const matches = await compare(password, row.password_hash);
  if (!matches) return null;

  return toAccount(row);
}

export const getCurrentAdmin = cache(async (): Promise<AdminAccount | null> => {
  const session = await getAdminSession();
  if (!session) return null;

  const rows = await getPrismaClient().$queryRaw<AdminRow[]>`
    select id, full_name, username, role, email, phone, password_hash, must_change_password
    from public.admin_users
    where id = ${session.sub}::uuid
      and is_active = true
    limit 1
  `;

  const row = rows[0];
  return row ? toAccount(row) : null;
});

export async function requireAdmin(): Promise<AdminAccount> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login/");
  return admin;
}

export async function requireEditor(): Promise<AdminAccount> {
  const admin = await requireAdmin();
  if (!canEdit(admin.role)) redirect("/admin/?error=read-only");
  return admin;
}

export async function hasSupabaseAdminConfig(): Promise<boolean> {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

type SupabaseUserResult = { ok: true; id: string } | { ok: false; error: string };

async function createSupabaseAuthUser(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<SupabaseUserResult> {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!baseUrl || !secretKey) {
    return {
      ok: false,
      error:
        "Supabase admin credentials are not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { full_name: input.fullName },
      }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Could not reach Supabase Auth. Try again shortly." };
  }

  const payload = (await response.json().catch(() => null)) as {
    id?: string;
    msg?: string;
    message?: string;
    error_description?: string;
    code?: string;
  } | null;

  if (!response.ok || !payload?.id) {
    if (payload?.code === "email_exists" || /already/i.test(payload?.msg ?? "")) {
      return { ok: false, error: "An auth account already uses that email address." };
    }
    return {
      ok: false,
      error:
        payload?.msg ??
        payload?.message ??
        payload?.error_description ??
        "Supabase rejected the account.",
    };
  }

  return { ok: true, id: payload.id };
}

async function deleteSupabaseAuthUser(id: string): Promise<void> {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!baseUrl || !secretKey) return;

  await fetch(`${baseUrl}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  }).catch(() => undefined);
}

export type BootstrapResult = { ok: true; admin: AdminAccount } | { ok: false; error: string };

export async function bootstrapFirstAdmin(input: {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  password: string;
}): Promise<BootstrapResult> {
  if ((await countAdmins()) > 0) {
    return { ok: false, error: "An administrator already exists. Sign in instead." };
  }

  const authUser = await createSupabaseAuthUser({
    email: input.email,
    password: input.password,
    fullName: input.fullName,
  });
  if (!authUser.ok) return authUser;

  const passwordHash = await hash(input.password, BCRYPT_COST);

  let inserted: AdminRow[];
  try {
    inserted = await getPrismaClient().$queryRaw<AdminRow[]>`
      insert into public.admin_users (
        id, full_name, phone, email, date_of_birth, username,
        role, is_active, password_hash, must_change_password
      )
      select
        ${authUser.id}::uuid,
        ${input.fullName},
        ${input.phone},
        ${input.email},
        ${input.dateOfBirth ?? null}::date,
        ${input.username},
        'owner',
        true,
        ${passwordHash},
        false
      where not exists (select 1 from public.admin_users)
      returning id, full_name, username, role, email, phone, password_hash, must_change_password
    `;
  } catch (error) {
    await deleteSupabaseAuthUser(authUser.id);
    const message =
      error instanceof Error && /admin_users_username/i.test(error.message)
        ? "That username is already taken."
        : "Could not create the administrator account.";
    return { ok: false, error: message };
  }

  const row = inserted[0];
  if (!row) {
    await deleteSupabaseAuthUser(authUser.id);
    return { ok: false, error: "An administrator already exists. Sign in instead." };
  }

  return { ok: true, admin: toAccount(row) };
}

export type PasswordChangeResult = { ok: true } | { ok: false; error: string };

export async function changeOwnPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
): Promise<PasswordChangeResult> {
  const rows = await getPrismaClient().$queryRaw<Array<{ password_hash: string }>>`
    select password_hash from public.admin_users where id = ${adminId}::uuid limit 1
  `;
  const row = rows[0];
  if (!row) return { ok: false, error: "Your account could not be found." };

  if (!(await compare(currentPassword, row.password_hash))) {
    return { ok: false, error: "The current password is incorrect." };
  }

  if (await compare(newPassword, row.password_hash)) {
    return { ok: false, error: "Choose a password you have not used before." };
  }

  const nextHash = await hash(newPassword, BCRYPT_COST);
  await getPrismaClient().$executeRaw`
    update public.admin_users
       set password_hash = ${nextHash},
           password_changed_at = now(),
           must_change_password = false
     where id = ${adminId}::uuid
  `;

  return { ok: true };
}

type Attempt = { count: number; resetAt: number };
const loginAttempts = new Map<string, Attempt>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function isLoginRateLimited(key: string, now = Date.now()): boolean {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (entry.resetAt <= now) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  if (loginAttempts.size > 10_000) {
    for (const [entryKey, entry] of loginAttempts) {
      if (entry.resetAt <= now) loginAttempts.delete(entryKey);
    }
  }

  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  loginAttempts.set(key, { count: entry.count + 1, resetAt: entry.resetAt });
}

export function clearLoginFailures(key: string): void {
  loginAttempts.delete(key);
}

export function loginRateLimitKey(username: string, ip: string): string {
  return `${username.toLowerCase()}|${ip}`;
}
