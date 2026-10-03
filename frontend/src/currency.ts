import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type CurrencyCode =
  | "EUR"
  | "USD"
  | "GBP"
  | "JPY"
  | "CHF"
  | "PLN"
  | "CNY"
  | "CAD"
  | "AUD";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
};

export const CURRENCIES: CurrencyInfo[] = [
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", decimals: 2 },
  { code: "USD", symbol: "$", name: "Dollaro USA", flag: "🇺🇸", decimals: 2 },
  { code: "GBP", symbol: "£", name: "Sterlina", flag: "🇬🇧", decimals: 2 },
  { code: "JPY", symbol: "¥", name: "Yen", flag: "🇯🇵", decimals: 0 },
  { code: "CHF", symbol: "₣", name: "Franco Svizzero", flag: "🇨🇭", decimals: 2 },
  { code: "PLN", symbol: "zł", name: "Zloty Polacco", flag: "🇵🇱", decimals: 2 },
  { code: "CNY", symbol: "¥", name: "Yuan Cinese", flag: "🇨🇳", decimals: 2 },
  { code: "CAD", symbol: "C$", name: "Dollaro Canadese", flag: "🇨🇦", decimals: 2 },
  { code: "AUD", symbol: "A$", name: "Dollaro Australiano", flag: "🇦🇺", decimals: 2 },
];

const CURRENCY_KEY = "gestore_conto_currency_v1";
const RATES_KEY = "gestore_conto_rates_v1";
const RATES_TTL_MS = 60 * 60 * 1000; // 1 hour

type RatesCache = {
  base: "EUR";
  rates: Record<string, number>;
  fetchedAt: number;
};

let currencyCache: CurrencyCode | null = null;
let ratesCache: RatesCache | null = null;
const currencyListeners = new Set<(c: CurrencyCode) => void>();
const ratesListeners = new Set<(r: RatesCache | null) => void>();

export async function loadSelectedCurrency(): Promise<CurrencyCode> {
  if (currencyCache) return currencyCache;
  try {
    const raw = await AsyncStorage.getItem(CURRENCY_KEY);
    currencyCache = (raw as CurrencyCode) || "EUR";
  } catch {
    currencyCache = "EUR";
  }
  return currencyCache;
}

export async function setSelectedCurrency(c: CurrencyCode) {
  currencyCache = c;
  try {
    await AsyncStorage.setItem(CURRENCY_KEY, c);
  } catch {}
  currencyListeners.forEach((l) => l(c));
}

async function loadRatesFromDisk(): Promise<RatesCache | null> {
  try {
    const raw = await AsyncStorage.getItem(RATES_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RatesCache;
  } catch {
    return null;
  }
}

async function saveRatesToDisk(r: RatesCache) {
  try {
    await AsyncStorage.setItem(RATES_KEY, JSON.stringify(r));
  } catch {}
}

export async function fetchRates(force = false): Promise<RatesCache | null> {
  if (!ratesCache) {
    ratesCache = await loadRatesFromDisk();
  }
  const fresh =
    ratesCache && Date.now() - ratesCache.fetchedAt < RATES_TTL_MS;
  if (fresh && !force) return ratesCache;

  const symbols = CURRENCIES.filter((c) => c.code !== "EUR")
    .map((c) => c.code)
    .join(",");
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${symbols}`,
    );
    if (!res.ok) throw new Error("rates fetch failed");
    const data = (await res.json()) as { rates: Record<string, number> };
    const next: RatesCache = {
      base: "EUR",
      rates: { EUR: 1, ...data.rates },
      fetchedAt: Date.now(),
    };
    ratesCache = next;
    await saveRatesToDisk(next);
    ratesListeners.forEach((l) => l(next));
    return next;
  } catch {
    return ratesCache;
  }
}

export function convertFromEUR(
  amountEUR: number,
  to: CurrencyCode,
  rates: RatesCache | null,
): number {
  if (!rates || to === "EUR") return amountEUR;
  const r = rates.rates[to];
  if (!r) return amountEUR;
  return amountEUR * r;
}

export function formatAmount(
  amount: number,
  info: CurrencyInfo,
  signed = false,
): string {
  const sign = amount < 0 ? "-" : signed ? "+" : "";
  const abs = Math.abs(amount);
  const n = abs.toLocaleString("it-IT", {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  });
  if (info.code === "PLN") return `${sign}${n} ${info.symbol}`;
  return `${sign}${info.symbol}${n}`;
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(
    currencyCache ?? "EUR",
  );
  const [rates, setRates] = useState<RatesCache | null>(ratesCache);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const c = await loadSelectedCurrency();
      if (!mounted) return;
      setCurrencyState(c);
      setLoading(true);
      const r = await fetchRates();
      if (!mounted) return;
      setRates(r);
      setLoading(false);
    })();

    const cl = (c: CurrencyCode) => setCurrencyState(c);
    const rl = (r: RatesCache | null) => setRates(r);
    currencyListeners.add(cl);
    ratesListeners.add(rl);
    return () => {
      mounted = false;
      currencyListeners.delete(cl);
      ratesListeners.delete(rl);
    };
  }, []);

  const info = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const format = (amountEUR: number, signed = false) => {
    const converted = convertFromEUR(amountEUR, currency, rates);
    return formatAmount(converted, info, signed);
  };

  const convert = (amountEUR: number) => convertFromEUR(amountEUR, currency, rates);

  return {
    currency,
    info,
    rates,
    loading,
    format,
    convert,
    setCurrency: setSelectedCurrency,
    refresh: () => fetchRates(true),
  };
}
