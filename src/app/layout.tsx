import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { RevealObserver } from "@/components/ui/reveal-observer";
import { brand } from "@/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RevealObserver />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="site-shell">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
