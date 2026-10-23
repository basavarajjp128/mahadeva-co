"use client";

import { usePathname } from "next/navigation";
import { siteNavigation } from "@/config/navigation";

function normalizePath(path: string) {
  return path === "/" ? path : path.replace(/\/+$/, "");
}

export function NavigationLinks() {
  const pathname = normalizePath(usePathname() ?? "/");

  return siteNavigation.map((item) => {
    const href = normalizePath(item.href);
    const isActive = pathname === href || (href === "/shop" && pathname.startsWith("/shop/"));

    return (
      <a aria-current={isActive ? "page" : undefined} href={item.href} key={item.href}>
        {item.label}
      </a>
    );
  });
}
