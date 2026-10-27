"use client";

import { Button } from "@/components/ui/button";

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="shop-page" id="main-content">
      <div className="container shop-page__container">
        <section aria-live="polite" className="status-state" role="alert">
          <h1 className="status-state__title">The catalogue is temporarily unavailable</h1>
          <p className="status-state__description">
            Please try again shortly, or contact SRI MAHADEVA &amp; CO to discuss your requirement.
          </p>
          <Button onClick={reset} size="small">
            Try again
          </Button>
        </section>
      </div>
    </main>
  );
}
