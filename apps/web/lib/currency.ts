import type { Currency } from "@/lib/products";

/* ── Types ── */

type RatesResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type CacheEntry = {
  rates: Record<string, number>;
  fetchedAt: number;
};

/* ── Cache ── */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ratesCache: Partial<Record<Currency, CacheEntry>> = {};

/* ── API ── */

export async function fetchExchangeRates(
  base: Currency,
): Promise<Record<string, number>> {
  const cached = ratesCache[base];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rates;
  }

  const res = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=${base}`,
  );

  if (!res.ok) {
    throw new Error(`Currency API error: ${res.status}`);
  }

  const data: RatesResponse = await res.json();

  ratesCache[base] = {
    rates: data.rates,
    fetchedAt: Date.now(),
  };

  return data.rates;
}

/**
 * Returns the exchange rate from `from` currency to TRY.
 * If `from` is already TRY, returns 1.
 */
export async function getRate(from: Currency): Promise<number> {
  if (from === "TRY") return 1;

  const rates = await fetchExchangeRates(from);
  const tryRate = rates["TRY"];

  if (tryRate == null) {
    throw new Error(`TRY rate not found for base ${from}`);
  }

  return tryRate;
}
