import { apiFetch } from "@/lib/api";
import type { Currency } from "@/lib/products";

type ExchangeRateRow = {
  currency?: string;
  rateToTry?: string | number;
};

type ExchangeRatesCache = {
  ratesToTry: Partial<Record<Currency, number>>;
  fetchedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let ratesCache: ExchangeRatesCache | null = null;

function isSupportedCurrency(value: string): value is Currency {
  return value === "TRY" || value === "USD" || value === "EUR";
}

function parseExchangeRates(payload: unknown): Partial<Record<Currency, number>> {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : [];

  const rates: Partial<Record<Currency, number>> = {};

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const row = item as ExchangeRateRow;
    if (!row.currency || !isSupportedCurrency(row.currency)) continue;

    const numeric = Number(row.rateToTry);
    if (!Number.isFinite(numeric) || numeric <= 0) continue;

    rates[row.currency] = numeric;
  }

  return rates;
}

export async function fetchExchangeRates(_base?: Currency): Promise<Partial<Record<Currency, number>>> {
  if (ratesCache && Date.now() - ratesCache.fetchedAt < CACHE_TTL_MS) {
    return ratesCache.ratesToTry;
  }

  const payload = await apiFetch<unknown>("/exchange-rates", {
    method: "GET",
  });
  const ratesToTry = parseExchangeRates(payload);

  ratesCache = {
    ratesToTry,
    fetchedAt: Date.now(),
  };

  return ratesToTry;
}

/**
 * Returns the exchange rate from `from` currency to TRY.
 * If `from` is already TRY, returns 1.
 */
export async function getRate(from: Currency): Promise<number> {
  if (from === "TRY") return 1;

  const rates = await fetchExchangeRates();
  const rateToTry = rates[from];

  if (rateToTry == null) {
    throw new Error(`rateToTry not found for currency ${from}`);
  }

  return rateToTry;
}
