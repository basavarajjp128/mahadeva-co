"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

const foreignCurrencies = ["USD", "EUR", "GBP", "AED", "AUD", "CAD"] as const;
const currencyCodes = ["INR", ...foreignCurrencies] as const;
type CurrencyCode = (typeof currencyCodes)[number];

const rateSchema = z.array(
  z.object({
    base: z.literal("INR"),
    quote: z.enum(foreignCurrencies),
    rate: z.number().finite().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
);

const ratesUrl = "https://api.frankfurter.dev/v2/rates?base=INR&quotes=USD,EUR,GBP,AED,AUD,CAD";

export function formatTestCurrency(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function convertTestPriceFromInr(amountInr: number, rate: number): number | null {
  if (!Number.isFinite(amountInr) || amountInr < 0 || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }
  const converted = amountInr * rate;
  return Number.isFinite(converted) ? converted : null;
}

export function TestPriceConverter({
  kilograms,
  pricePerKgRupees,
}: {
  kilograms: number;
  pricePerKgRupees: number;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [rates, setRates] = useState<Partial<Record<CurrencyCode, number>>>({ INR: 1 });
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [rateStatus, setRateStatus] = useState("Loading indicative reference rates…");

  useEffect(() => {
    const controller = new AbortController();
    fetch(ratesUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("rates-unavailable");
        const parsed = rateSchema.safeParse(await response.json());
        if (!parsed.success || parsed.data.length === 0) throw new Error("invalid-rates");
        const nextRates: Partial<Record<CurrencyCode, number>> = { INR: 1 };
        for (const item of parsed.data) nextRates[item.quote] = item.rate;
        setRates(nextRates);
        setRateDate(parsed.data[0]?.date ?? null);
        setRateStatus("Indicative display conversion only; actual checkout remains in INR.");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRateStatus("Reference rates are unavailable. The test price is shown in INR only.");
        }
      });
    return () => controller.abort();
  }, []);

  const rate = rates[currency];
  const perKg = rate === undefined ? null : convertTestPriceFromInr(pricePerKgRupees, rate);
  const total =
    rate === undefined ? null : convertTestPriceFromInr(pricePerKgRupees * kilograms, rate);

  return (
    <section aria-label="Test price and currency display" className="test-price-converter">
      <p className="test-price-converter__notice">
        TEST PRICE · DEVELOPMENT ONLY · NOT A BUSINESS QUOTE
      </p>
      <div className="form-field">
        <label htmlFor="test-display-currency">Display currency</label>
        <select
          className="form-control"
          id="test-display-currency"
          onChange={(event) => setCurrency(event.currentTarget.value as CurrencyCode)}
          value={currency}
        >
          {currencyCodes.map((code) => (
            <option disabled={code !== "INR" && rates[code] === undefined} key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      <p aria-live="polite" className="test-price-converter__price">
        {perKg === null
          ? `${formatTestCurrency(pricePerKgRupees, "INR")} per kg · conversion unavailable`
          : `${formatTestCurrency(perKg, currency)} per kg`}
        {kilograms > 0
          ? total === null
            ? ` · ${formatTestCurrency(pricePerKgRupees * kilograms, "INR")} test estimate`
            : ` · ${formatTestCurrency(total, currency)} test estimate for ${kilograms.toLocaleString("en-IN")} kg`
          : ""}
      </p>
      <p className="form-field__hint" role="status">
        {rateDate ? `Reference-rate date: ${rateDate}. ` : ""}
        {rateStatus} This sample amount is not used as a real offer or production price.
      </p>
    </section>
  );
}
