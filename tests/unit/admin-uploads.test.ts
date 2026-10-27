import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/product-image";
import { saveProductImage, sniffImageType } from "@/server/admin/uploads";

const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const pngBytes = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(8),
]);
const webpBytes = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from("WEBPVP8 ", "ascii"),
  Buffer.alloc(8),
]);

function makeFile(bytes: Buffer, name = "photo", type = "image/jpeg"): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("sniffImageType", () => {
  it("detects JPEG, PNG and WebP from magic bytes", () => {
    expect(sniffImageType(jpegBytes)).toEqual({ extension: "jpg" });
    expect(sniffImageType(pngBytes)).toEqual({ extension: "png" });
    expect(sniffImageType(webpBytes)).toEqual({ extension: "webp" });
  });

  it("rejects SVG, GIF and truncated payloads", () => {
    expect(sniffImageType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniffImageType(Buffer.from("GIF89a", "ascii"))).toBeNull();
    expect(sniffImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
  });

  it("ignores the browser-supplied MIME type and name", async () => {
    const disguised = makeFile(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"), "x.png");
    const result = await saveProductImage(disguised);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/JPEG, PNG or WebP/);
  });

  it("rejects empty and oversized files before sniffing", async () => {
    const empty = await saveProductImage(makeFile(Buffer.alloc(0)));
    expect(empty).toMatchObject({ ok: false });

    const oversized = await saveProductImage(
      makeFile(Buffer.alloc(PRODUCT_IMAGE_MAX_BYTES + 1, 0xff)),
    );
    expect(oversized).toMatchObject({ ok: false });
    if (!oversized.ok) expect(oversized.error).toMatch(/5 MB/);
  });
});
