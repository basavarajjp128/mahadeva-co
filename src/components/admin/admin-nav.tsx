"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/admin/",
    label: "Overview",
    path: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  },
  {
    href: "/admin/products/",
    label: "Products",
    path: "M21 8.5 12 3 3 8.5 12 14l9-5.5ZM3 8.5v7L12 21l9-5.5v-7M12 14v7",
  },
  {
    href: "/admin/inventory/",
    label: "Inventory",
    path: "M4 6h16M4 12h16M4 18h10M18 16v6M15 19h6",
  },
  {
    href: "/admin/enquiries/",
    label: "Enquiries",
    path: "M21 12a8 8 0 0 1-8 8H4l3-3a8 8 0 1 1 14-5Z",
  },
] as const;

function normalise(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function AdminNav() {
  const pathname = normalise(usePathname() ?? "/admin");

  return (
    <nav aria-label="Admin sections" className="admin-nav">
      {items.map((item) => {
        const target = normalise(item.href);
        const active =
          target === "/admin"
            ? pathname === "/admin"
            : pathname === target || pathname.startsWith(`${target}/`);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`admin-nav__link${active ? " admin-nav__link--active" : ""}`}
            href={item.href}
            key={item.href}
          >
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
              <path
                d={item.path}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
