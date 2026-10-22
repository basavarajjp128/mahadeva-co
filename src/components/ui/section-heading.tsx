import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  children: ReactNode;
  description?: string;
  id?: string;
  level?: 2 | 3;
};

export function SectionHeading({
  eyebrow,
  children,
  description,
  id,
  level = 2,
}: SectionHeadingProps) {
  const Heading = level === 3 ? "h3" : "h2";

  return (
    <div className="section-heading-block">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <Heading className="section-heading" id={id}>
        {children}
      </Heading>
      {description ? <p className="body-copy">{description}</p> : null}
    </div>
  );
}
