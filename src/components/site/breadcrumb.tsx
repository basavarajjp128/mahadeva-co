type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span aria-current={isLast ? "page" : undefined} key={item.href ?? item.label}>
            {item.href && !isLast ? <a href={item.href}>{item.label}</a> : item.label}
            {!isLast ? (
              <span aria-hidden="true" className="breadcrumb__separator">
                /
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
