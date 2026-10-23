import Image from "next/image";
import { galleryItems } from "@/data/gallery";

export function GalleryGrid() {
  return (
    <div className="gallery-grid">
      {galleryItems.map((item) => (
        <figure className="gallery-card" data-reveal key={item.id}>
          {item.image ? (
            <>
              <a
                aria-label={`Open full-size image: ${item.title}`}
                className="gallery-card__image-link"
                href={item.image}
                rel="noreferrer"
                target="_blank"
              >
                <span className="gallery-card__media">
                  <Image
                    alt={item.alt}
                    className="gallery-card__image"
                    fill
                    loading="lazy"
                    sizes="(max-width: 40rem) 100vw, (max-width: 64rem) 50vw, 25vw"
                    src={item.image}
                  />
                  <span aria-hidden="true" className="gallery-card__overlay" />
                  <span aria-hidden="true" className="gallery-card__overlay-copy">
                    <span className="gallery-card__title">{item.title}</span>
                    <span className="gallery-card__description">{item.description}</span>
                  </span>
                </span>
              </a>
              <figcaption className="gallery-card__caption">
                <span className="gallery-card__caption-title">{item.title}</span>
                <span>{item.description}</span>
              </figcaption>
            </>
          ) : (
            <>
              <div
                aria-label={item.alt}
                className="gallery-card__media gallery-card__placeholder"
                role="img"
              >
                <span className="gallery-card__placeholder-icon" aria-hidden="true">
                  ◇
                </span>
                <span>{item.placeholderLabel}</span>
              </div>
              <figcaption className="gallery-card__caption">
                <span className="gallery-card__caption-title">{item.title}</span>
                <span>{item.description}</span>
              </figcaption>
            </>
          )}
        </figure>
      ))}
    </div>
  );
}
