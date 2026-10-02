import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { AppState, Section, Transaction } from "./types";

const KEY = "gestore_conto_state_v1";

const DEFAULT_STATE: AppState = {
  sections: [
    {
      id: "main",
      name: "Conto Principale",
      icon: "credit-card",
      color: "purple",
      balance: 0,
      createdAt: new Date().toISOString(),
    },
  ],
  transactions: [],
};

type Listener = (s: AppState) => void;
let cache: AppState | null = null;
const listeners = new Set<Listener>();

async function load(): Promise<AppState> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as AppState;
    } else {
      cache = DEFAULT_STATE;
      await AsyncStorage.setItem(KEY, JSON.stringify(cache));
    }
  } catch {
    cache = DEFAULT_STATE;
  }
  return cache;
}

async function persist(next: AppState) {
  cache = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l(next));
}

export function useAppState() {
  const [state, setState] = useState<AppState | null>(cache);

  useEffect(() => {
    let mounted = true;
    load().then((s) => {
      if (mounted) setState(s);
    });
    const listener: Listener = (s) => setState({ ...s });
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return state;
}

function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export async function addSection(data: Omit<Section, "id" | "balance" | "createdAt">) {
  const s = await load();
  const next: AppState = {
    ...s,
    sections: [
      ...s.sections,
      {
        ...data,
        id: uid(),
        balance: 0,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  await persist(next);
}

export async function deleteSection(id: string) {
  const s = await load();
  if (id === "main") return;
  const section = s.sections.find((x) => x.id === id);
  if (!section) return;
  // Move balance back to main
  const next: AppState = {
    ...s,
    sections: s.sections
      .filter((x) => x.id !== id)
      .map((x) =>
        x.id === "main" ? { ...x, balance: x.balance + section.balance } : x,
      ),
    transactions: s.transactions.filter(
      (t) => t.sectionId !== id && t.toSectionId !== id,
    ),
  };
  await persist(next);
}

export async function addTransaction(
  t: Omit<Transaction, "id" | "createdAt">,
): Promise<{ ok: boolean; error?: string }> {
  const s = await load();
  const section = s.sections.find((x) => x.id === t.sectionId);
  if (!section) return { ok: false, error: "Sezione non trovata" };

  const tx: Transaction = {
    ...t,
    id: uid(),
    createdAt: new Date().toISOString(),
  };

  let sections = s.sections;

  if (t.type === "income") {
    sections = sections.map((x) =>
      x.id === t.sectionId ? { ...x, balance: x.balance + t.amount } : x,
    );
  } else if (t.type === "expense") {
    if (section.balance < t.amount) {
      // Allow negative, but we won't block
    }
    sections = sections.map((x) =>
      x.id === t.sectionId ? { ...x, balance: x.balance - t.amount } : x,
    );
  } else if (t.type === "transfer") {
    if (!t.toSectionId || t.toSectionId === t.sectionId) {
      return { ok: false, error: "Seleziona una sezione di destinazione diversa" };
    }
    const dest = s.sections.find((x) => x.id === t.toSectionId);
    if (!dest) return { ok: false, error: "Destinazione non trovata" };
    sections = sections.map((x) => {
      if (x.id === t.sectionId) return { ...x, balance: x.balance - t.amount };
      if (x.id === t.toSectionId) return { ...x, balance: x.balance + t.amount };
      return x;
    });
  }

  const next: AppState = {
    sections,
    transactions: [tx, ...s.transactions],
  };
  await persist(next);
  return { ok: true };
}

export async function deleteTransaction(id: string) {
  const s = await load();
  const tx = s.transactions.find((t) => t.id === id);
  if (!tx) return;
  let sections = s.sections;
  if (tx.type === "income") {
    sections = sections.map((x) =>
      x.id === tx.sectionId ? { ...x, balance: x.balance - tx.amount } : x,
    );
  } else if (tx.type === "expense") {
    sections = sections.map((x) =>
      x.id === tx.sectionId ? { ...x, balance: x.balance + tx.amount } : x,
    );
  } else if (tx.type === "transfer" && tx.toSectionId) {
    sections = sections.map((x) => {
      if (x.id === tx.sectionId) return { ...x, balance: x.balance + tx.amount };
      if (x.id === tx.toSectionId) return { ...x, balance: x.balance - tx.amount };
      return x;
    });
  }
  const next: AppState = {
    sections,
    transactions: s.transactions.filter((t) => t.id !== id),
  };
  await persist(next);
}

export function totalBalance(state: AppState): number {
  return state.sections.reduce((sum, s) => sum + s.balance, 0);
}

export function monthlyStats(state: AppState) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let income = 0;
  let expense = 0;
  for (const t of state.transactions) {
    const d = new Date(t.createdAt);
    if (d.getMonth() === month && d.getFullYear() === year) {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    }
  }
  return { income, expense };
}

export function formatCurrency(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}€${abs.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
