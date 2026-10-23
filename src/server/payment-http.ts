import "server-only";

import { MAX_PAYMENT_REQUEST_BYTES } from "@/server/payment-policy";

export type BodyReadResult = { ok: true; text: string } | { ok: false; status: 400 | 413 | 415 };

export function requestHasAllowedOrigin(request: Request, expectedOrigin: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

export async function readJsonBody(request: Request): Promise<BodyReadResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, status: 415 };

  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength &&
    (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_PAYMENT_REQUEST_BYTES)
  ) {
    return { ok: false, status: 413 };
  }

  const stream = request.body;
  if (!stream) return { ok: false, status: 400 };
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_PAYMENT_REQUEST_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  }

  try {
    const joined = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      joined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(joined) };
  } catch {
    return { ok: false, status: 400 };
  }
}

export function paymentError(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function paymentSuccess<T>(body: T): Response {
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
