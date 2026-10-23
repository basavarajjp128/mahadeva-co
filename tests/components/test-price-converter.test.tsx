import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  convertTestPriceFromInr,
  formatTestCurrency,
  TestPriceConverter,
} from "@/components/catalogue/test-price-converter";

describe("test currency conversion", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("converts only valid finite values and formats common currencies", () => {
    expect(convertTestPriceFromInr(35, 0.012)).toBeCloseTo(0.42);
    expect(convertTestPriceFromInr(Number.NaN, 1)).toBeNull();
    expect(convertTestPriceFromInr(35, Number.POSITIVE_INFINITY)).toBeNull();
    expect(formatTestCurrency(35, "INR")).toContain("35.00");
  });

  it("updates the displayed test price from a validated indicative reference rate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            { base: "INR", quote: "USD", rate: 0.012, date: "2026-10-22" },
            { base: "INR", quote: "EUR", rate: 0.011, date: "2026-10-22" },
          ]),
          { status: 200 },
        ),
      ),
    );

    render(<TestPriceConverter kilograms={25} pricePerKgRupees={35} />);
    await waitFor(() =>
      expect(screen.getByText(/Indicative display conversion only/)).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText("Display currency"), { target: { value: "USD" } });
    expect(await screen.findByText(/\$0\.42 per kg/)).toBeInTheDocument();
    expect(screen.getByText(/\$10\.50 test estimate for 25 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Reference-rate date: 2026-10-22/)).toBeInTheDocument();
  });
});
