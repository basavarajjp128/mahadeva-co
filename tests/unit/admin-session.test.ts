import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/server/admin/session-token";

const baseSession = {
  sub: "0f8fad5b-d9cb-469f-a165-70867728950e",
  username: "owner",
  name: "Owner Account",
  role: "owner" as const,
};

describe("admin session token", () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
  });

  afterEach(() => {
    delete process.env.ADMIN_SESSION_SECRET;
  });

  it("round-trips a valid token", () => {
    const token = createSessionToken(baseSession);
    expect(verifySessionToken(token)).toMatchObject(baseSession);
  });

  it("rejects a tampered payload", () => {
    const token = createSessionToken(baseSession);
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...baseSession, role: "admin", exp: 9999999999 }),
    ).toString("base64url");

    expect(verifySessionToken(`${forged}.${signature}`)).toBeNull();
    expect(verifySessionToken(`${payload}.${signature}x`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const issuedAt = Date.now() - 9 * 60 * 60 * 1000;
    const token = createSessionToken(baseSession, issuedAt);
    expect(verifySessionToken(token)).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    const token = createSessionToken(baseSession);
    process.env.ADMIN_SESSION_SECRET = "another-secret-that-is-long-enough-to-pass";
    expect(verifySessionToken(token)).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("only-one-part")).toBeNull();
    expect(verifySessionToken("a.b.c")).toBeNull();
  });

  it("requires a strong configured secret", () => {
    process.env.ADMIN_SESSION_SECRET = "too-short";
    expect(() => createSessionToken(baseSession)).toThrow(/ADMIN_SESSION_SECRET/);
  });
});
