"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AdminField } from "@/components/admin/ui";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_FORMATS,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_SIZE_LABEL,
} from "@/lib/product-image";

type Props = {
  id?: string;
  name?: string;
  initialImage?: string | null;
  initialAlt?: string | null;
  error?: string;
};

export function ProductImageUpload({
  id = "image",
  name = "image",
  initialImage = null,
  initialAlt = null,
  error,
}: Props) {
  const [preview, setPreview] = useState<string | null>(initialImage);
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasNewFile, setHasNewFile] = useState(false);
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function replacePreview(url: string | null) {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = url;
    setPreview(url ?? initialImage);
    setHasNewFile(Boolean(url));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setLocalError(null);

    if (!file) {
      replacePreview(null);
      return;
    }

    if (!PRODUCT_IMAGE_ACCEPT.split(",").includes(file.type)) {
      setLocalError(`Use a ${PRODUCT_IMAGE_FORMATS} image.`);
      event.target.value = "";
      replacePreview(null);
      return;
    }

    if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
      setLocalError(`Images must be ${PRODUCT_IMAGE_SIZE_LABEL} or smaller.`);
      event.target.value = "";
      replacePreview(null);
      return;
    }

    replacePreview(URL.createObjectURL(file));
  }

  const message = error ?? localError ?? undefined;

  return (
    <div className="admin-image-field">
      <AdminField
        error={message}
        hint={`${PRODUCT_IMAGE_FORMATS}, ${PRODUCT_IMAGE_SIZE_LABEL} maximum. An upload overrides the saved image path.`}
        id={id}
        label="Upload image"
      >
        <input
          accept={PRODUCT_IMAGE_ACCEPT}
          aria-describedby={`${id}-hint${message ? ` ${id}-error` : ""}`}
          className="admin-input admin-input--file"
          id={id}
          name={name}
          onChange={handleChange}
          type="file"
        />
      </AdminField>

      {preview ? (
        <figure className="admin-image-preview">
          {/* Admin preview only: newly picked files use a blob URL. */}
          <Image
            alt={initialAlt ?? "Selected product image preview"}
            height={360}
            src={preview}
            unoptimized
            width={480}
          />
          <figcaption>
            {hasNewFile ? "Preview of the selected file — not saved yet" : "Current saved image"}
          </figcaption>
        </figure>
      ) : (
        <p className="admin-field__hint">
          No image saved yet. The storefront falls back to the bundled copra photo.
        </p>
      )}
    </div>
  );
}
