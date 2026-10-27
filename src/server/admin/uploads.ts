import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  PRODUCT_IMAGE_FORMATS,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_SIZE_LABEL,
} from "@/lib/product-image";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const PUBLIC_PREFIX = "/uploads/products";
const MANAGED_FILE = /^[0-9a-f-]{36}\.(?:jpg|png|webp)$/;

type ImageType = { extension: "jpg" | "png" | "webp" };

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Detects the image type from magic bytes. The browser-supplied MIME type and
 * filename are never trusted: SVG and other active content must not be served
 * from this origin.
 */
export function sniffImageType(buffer: Buffer): ImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: "jpg" };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { extension: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp" };
  }
  return null;
}

export type SavedImage = { path: string };
export type SaveImageResult = { ok: true; image: SavedImage } | { ok: false; error: string };

/** Validates and stores an uploaded product photo under public/uploads/products. */
export async function saveProductImage(file: File): Promise<SaveImageResult> {
  if (file.size === 0) {
    return { ok: false, error: "The selected image is empty. Choose another file." };
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: `Images must be ${PRODUCT_IMAGE_SIZE_LABEL} or smaller.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    return { ok: false, error: "The selected image is empty. Choose another file." };
  }
  if (buffer.byteLength > PRODUCT_IMAGE_MAX_BYTES) {
    return { ok: false, error: `Images must be ${PRODUCT_IMAGE_SIZE_LABEL} or smaller.` };
  }

  const type = sniffImageType(buffer);
  if (!type) {
    return { ok: false, error: `Upload a ${PRODUCT_IMAGE_FORMATS} image.` };
  }

  const filename = `${randomUUID()}.${type.extension}`;
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), buffer, { flag: "wx", mode: 0o644 });
  } catch {
    return {
      ok: false,
      error:
        "The server could not store the image. Paste an image path or https URL instead, or ask the site owner to check write access to public/uploads/products.",
    };
  }

  return { ok: true, image: { path: `${PUBLIC_PREFIX}/${filename}` } };
}

/**
 * Removes an admin-uploaded image. Paths outside the managed upload folder
 * (bundled artwork, external URLs) are left untouched.
 */
export async function deleteManagedProductImage(publicPath: string | null): Promise<void> {
  if (!publicPath?.startsWith(`${PUBLIC_PREFIX}/`)) return;

  const filename = publicPath.slice(PUBLIC_PREFIX.length + 1);
  if (!MANAGED_FILE.test(filename)) return;

  await unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);
}
