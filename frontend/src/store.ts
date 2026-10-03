import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  AppState,
  Bill,
  BillRepeat,
  Category,
  RecurringRule,
  Section,
  Transaction,
  seedCategories,
} from "./types";

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
  categories: seedCategories(),
  recurring: [],
  bills: [],
};

type Listener = (s: AppState) => void;
let cache: AppState | null = null;
const listeners = new Set<Listener>();

export async function load(): Promise<AppState> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      // Migration: ensure new fields exist
      cache = {
        sections: parsed.sections ?? DEFAULT_STATE.sections,
        transactions: parsed.transactions ?? [],
        categories:
          parsed.categories && parsed.categories.length > 0
            ? parsed.categories
            : seedCategories(),
        recurring: parsed.recurring ?? [],
        bills: parsed.bills ?? [],
      };
      // Save back the migrated state
      await AsyncStorage.setItem(KEY, JSON.stringify(cache));
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
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- Sections ---

export async function addSection(
  data: Omit<Section, "id" | "balance" | "createdAt">,
) {
  const s = await load();
  await persist({
    ...s,
    sections: [
      ...s.sections,
      { ...data, id: uid(), balance: 0, createdAt: new Date().toISOString() },
    ],
  });
}

export async function deleteSection(id: string) {
  const s = await load();
  if (id === "main") return;
  const section = s.sections.find((x) => x.id === id);
  if (!section) return;
  await persist({
    ...s,
    sections: s.sections
      .filter((x) => x.id !== id)
      .map((x) =>
        x.id === "main" ? { ...x, balance: x.balance + section.balance } : x,
      ),
    transactions: s.transactions.filter(
      (t) => t.sectionId !== id && t.toSectionId !== id,
    ),
  });
}

// --- Transactions ---

export async function addTransaction(
  t: Omit<Transaction, "id" | "createdAt"> & { createdAt?: string },
): Promise<{ ok: boolean; error?: string }> {
  const s = await load();
  const section = s.sections.find((x) => x.id === t.sectionId);
  if (!section) return { ok: false, error: "Sezione non trovata" };

  const tx: Transaction = {
    ...t,
    id: uid(),
    createdAt: t.createdAt ?? new Date().toISOString(),
  };

  let sections = s.sections;

  if (t.type === "income") {
    sections = sections.map((x) =>
      x.id === t.sectionId ? { ...x, balance: x.balance + t.amount } : x,
    );
  } else if (t.type === "expense") {
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

  await persist({
    ...s,
    sections,
    transactions: [tx, ...s.transactions],
  });
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
  await persist({
    ...s,
    sections,
    transactions: s.transactions.filter((t) => t.id !== id),
  });
}

// --- Categories ---

export async function addCategory(
  data: Omit<Category, "id" | "order" | "builtIn" | "archived">,
) {
  const s = await load();
  const existingOfType = s.categories.filter((c) => c.type === data.type);
  const maxOrder = existingOfType.reduce((m, c) => Math.max(m, c.order), -1);
  const cat: Category = {
    ...data,
    id: uid(),
    order: maxOrder + 1,
    builtIn: false,
  };
  await persist({ ...s, categories: [...s.categories, cat] });
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, "name" | "icon" | "color" | "order">>,
) {
  const s = await load();
  await persist({
    ...s,
    categories: s.categories.map((c) =>
      c.id === id ? { ...c, ...patch } : c,
    ),
  });
}

export async function deleteCategory(id: string) {
  const s = await load();
  const cat = s.categories.find((c) => c.id === id);
  if (!cat || cat.builtIn) return;
  // Archive instead of delete to preserve history
  const stillInUse = s.transactions.some((t) => t.category === id);
  if (stillInUse) {
    await persist({
      ...s,
      categories: s.categories.map((c) =>
        c.id === id ? { ...c, archived: true } : c,
      ),
    });
  } else {
    await persist({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
    });
  }
}

export async function reorderCategories(type: "income" | "expense", orderedIds: string[]) {
  const s = await load();
  const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
  await persist({
    ...s,
    categories: s.categories.map((c) =>
      c.type === type && orderMap.has(c.id)
        ? { ...c, order: orderMap.get(c.id)! }
        : c,
    ),
  });
}

// --- Recurring ---

export async function addRecurring(
  data: Omit<RecurringRule, "id" | "createdAt" | "paused" | "lastGeneratedDate">,
) {
  const s = await load();
  const rule: RecurringRule = {
    ...data,
    id: uid(),
    paused: false,
    createdAt: new Date().toISOString(),
  };
  await persist({ ...s, recurring: [...s.recurring, rule] });
}

export async function updateRecurring(id: string, patch: Partial<RecurringRule>) {
  const s = await load();
  await persist({
    ...s,
    recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  });
}

export async function deleteRecurring(id: string) {
  const s = await load();
  await persist({
    ...s,
    recurring: s.recurring.filter((r) => r.id !== id),
  });
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseIsoDate(s: string): Date {
  // Treat date-only as local midnight
  const [y, m, d] = s.slice(0, 10).split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

function addFreq(d: Date, freq: RecurringRule["frequency"]): Date {
  const n = new Date(d);
  if (freq === "weekly") n.setDate(n.getDate() + 7);
  else if (freq === "monthly") n.setMonth(n.getMonth() + 1);
  else n.setFullYear(n.getFullYear() + 1);
  return n;
}

export async function processRecurring(now = new Date()): Promise<number> {
  const s = await load();
  const today = parseIsoDate(iso(now));
  let generated = 0;
  const nextRules: RecurringRule[] = [];
  let sections = s.sections;
  const newTxs: Transaction[] = [];

  for (const rule of s.recurring) {
    if (rule.paused) {
      nextRules.push(rule);
      continue;
    }
    const start = parseIsoDate(rule.startDate);
    const end = rule.endDate ? parseIsoDate(rule.endDate) : null;
    let next: Date;
    if (rule.lastGeneratedDate) {
      next = addFreq(parseIsoDate(rule.lastGeneratedDate), rule.frequency);
    } else {
      next = start;
    }
    let lastGenerated = rule.lastGeneratedDate;
    while (next.getTime() <= today.getTime() && (!end || next.getTime() <= end.getTime())) {
      // Create transaction with createdAt = iso(next) + T12:00:00
      const createdAt = iso(next) + "T12:00:00.000Z";
      const section = sections.find((x) => x.id === rule.sectionId);
      if (!section) break; // section deleted — skip
      const tx: Transaction = {
        id: uid(),
        type: rule.type,
        amount: rule.amount,
        category: rule.categoryId,
        note: rule.note,
        sectionId: rule.sectionId,
        createdAt,
      };
      if (rule.type === "income") {
        sections = sections.map((x) =>
          x.id === rule.sectionId ? { ...x, balance: x.balance + rule.amount } : x,
        );
      } else {
        sections = sections.map((x) =>
          x.id === rule.sectionId ? { ...x, balance: x.balance - rule.amount } : x,
        );
      }
      newTxs.push(tx);
      lastGenerated = iso(next);
      generated++;
      next = addFreq(next, rule.frequency);
    }
    nextRules.push({ ...rule, lastGeneratedDate: lastGenerated });
  }

  if (generated > 0) {
    await persist({
      ...s,
      sections,
      transactions: [...newTxs.reverse(), ...s.transactions],
      recurring: nextRules,
    });
  } else {
    // Even if nothing generated, persist updated lastGeneratedDate (for safety)
    await persist({ ...s, recurring: nextRules });
  }
  return generated;
}

// --- Bills ---

export async function addBill(data: Omit<Bill, "id" | "createdAt" | "archived">) {
  const s = await load();
  const bill: Bill = {
    ...data,
    id: uid(),
    archived: false,
    createdAt: new Date().toISOString(),
  };
  await persist({ ...s, bills: [...s.bills, bill] });
}

export async function updateBill(id: string, patch: Partial<Bill>) {
  const s = await load();
  await persist({
    ...s,
    bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
  });
}

export async function deleteBill(id: string) {
  const s = await load();
  await persist({ ...s, bills: s.bills.filter((b) => b.id !== id) });
}

function advanceBill(bill: Bill): Bill {
  if (bill.repeat === "once") return { ...bill, archived: true };
  const d = parseIsoDate(bill.dueDate);
  if (bill.repeat === "monthly") d.setMonth(d.getMonth() + 1);
  else if (bill.repeat === "bimonthly") d.setMonth(d.getMonth() + 2);
  else d.setFullYear(d.getFullYear() + 1);
  return { ...bill, dueDate: iso(d) };
}

/** Pays a bill by (optionally) creating an expense tx + advancing / archiving bill. */
export async function payBill(
  billId: string,
  opts: { createExpense: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const s = await load();
  const bill = s.bills.find((b) => b.id === billId);
  if (!bill) return { ok: false, error: "Bolletta non trovata" };

  let sections = s.sections;
  const newTxs: Transaction[] = [];

  if (opts.createExpense) {
    if (!bill.amount || bill.amount <= 0) {
      return { ok: false, error: "Imposta un importo per la bolletta" };
    }
    const sectionId = bill.sectionId ?? "main";
    const section = sections.find((x) => x.id === sectionId);
    if (!section) return { ok: false, error: "Sezione non trovata" };
    const tx: Transaction = {
      id: uid(),
      type: "expense",
      amount: bill.amount,
      category: "bills",
      note: bill.name,
      sectionId,
      createdAt: new Date().toISOString(),
    };
    sections = sections.map((x) =>
      x.id === sectionId ? { ...x, balance: x.balance - bill.amount! } : x,
    );
    newTxs.push(tx);
  }

  const nextBill = advanceBill(bill);
  await persist({
    ...s,
    sections,
    transactions: [...newTxs, ...s.transactions],
    bills: s.bills.map((b) => (b.id === billId ? nextBill : b)),
  });
  return { ok: true };
}

export function daysUntil(iso: string, now = new Date()): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map((n) => parseInt(n, 10));
  const target = new Date(y, (m || 1) - 1, d || 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function upcomingBills(bills: Bill[], withinDays = 7, now = new Date()): Bill[] {
  return bills
    .filter((b) => !b.archived)
    .filter((b) => daysUntil(b.dueDate, now) <= withinDays)
    .sort((a, b) => daysUntil(a.dueDate, now) - daysUntil(b.dueDate, now));
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

export async function resetAllData() {
  cache = { ...DEFAULT_STATE, categories: seedCategories() };
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l(cache!));
}

export function getActiveCategories(state: AppState, type: "income" | "expense"): Category[] {
  return state.categories
    .filter((c) => c.type === type && !c.archived)
    .sort((a, b) => a.order - b.order);
}
