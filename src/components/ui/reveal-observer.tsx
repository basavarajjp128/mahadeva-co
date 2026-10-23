"use client";

import { useEffect } from "react";

export function RevealObserver() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const root = document.documentElement;
    let revealIndex = 0;
    const registeredTargets = new WeakSet<Element>();
    const intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.08 },
    );

    function registerReveal(node: Node) {
      if (!(node instanceof Element)) return;

      const targets: Element[] = [];
      if (node.matches("[data-reveal]")) targets.push(node);
      targets.push(...node.querySelectorAll("[data-reveal]"));

      for (const target of targets) {
        if (
          !(target instanceof HTMLElement) ||
          target.classList.contains("is-revealed") ||
          registeredTargets.has(target)
        ) {
          continue;
        }
        registeredTargets.add(target);
        const stagger = Math.min(revealIndex % 5, 4) * 65;
        target.style.setProperty("--reveal-delay", `${stagger}ms`);
        intersectionObserver.observe(target);
        revealIndex += 1;
      }
    }

    registerReveal(document.body);
    root.classList.add("motion-enabled");

    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) registerReveal(node);
      }
    });
    mutationObserver.observe(document.querySelector(".site-shell") ?? document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      root.classList.remove("motion-enabled");
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        element.classList.remove("is-revealed");
        if (element instanceof HTMLElement) element.style.removeProperty("--reveal-delay");
      });
    };
  }, []);

  return null;
}
