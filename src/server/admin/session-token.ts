import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "smc_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export const adminRoles = ["owner", "admin", "manager", "viewer"] as const;

export type AdminRole = (typeof adminRoles)[number];

export type AdminSession = {
  sub: string;
  username: string;
  name: string;
  role: AdminRole;
  exp: number;
};

function sessionSecret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set to at least 32 characters");
  }
  return value;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", sessionSecret()).update(encodedPayload).digest("base64url");
}

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (adminRoles as readonly string[]).includes(value);
}

export function createSessionToken(input: Omit<AdminSession, "exp">, now = Date.now()): string {
  const payload: AdminSession = {
    ...input,
    exp: Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  now = Date.now(),
): AdminSession | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const provided = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) return null;

  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<
      Record<keyof AdminSession, unknown>
    >;

    if (
      typeof data.sub !== "string" ||
      data.sub.length < 10 ||
      data.sub.length > 64 ||
      typeof data.username !== "string" ||
      data.username.length > 60 ||
      typeof data.name !== "string" ||
      data.name.length > 160 ||
      !isAdminRole(data.role) ||
      typeof data.exp !== "number" ||
      !Number.isFinite(data.exp)
    ) {
      return null;
    }

    if (data.exp * 1000 <= now) return null;

    return {
      sub: data.sub,
      username: data.username,
      name: data.name,
      role: data.role,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}
