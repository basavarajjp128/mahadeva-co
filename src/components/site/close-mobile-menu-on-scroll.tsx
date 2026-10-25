"use client";

import { useEffect } from "react";

export function CloseMobileMenuOnScroll() {
  useEffect(() => {
    function closeOpenMobileMenu() {
      if (!window.matchMedia("(width < 64rem)").matches) return;
      const openMenu = document.querySelector<HTMLDetailsElement>(".mobile-nav[open]");
      if (openMenu) openMenu.open = false;
    }

    window.addEventListener("scroll", closeOpenMobileMenu, { passive: true });
    return () => window.removeEventListener("scroll", closeOpenMobileMenu);
  }, []);

  return null;
}
