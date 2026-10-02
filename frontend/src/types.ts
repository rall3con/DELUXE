export type TxType = "income" | "expense" | "transfer";

export interface Section {
  id: string;
  name: string;
  icon: string; // feather icon name
  color: "purple" | "green" | "pink";
  target?: number; // optional savings target
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note?: string;
  sectionId: string; // for income/expense, the pot it affects. For transfer: source
  toSectionId?: string; // for transfer: destination
  createdAt: string;
}

export interface AppState {
  sections: Section[];
  transactions: Transaction[];
}

export const INCOME_CATEGORIES = [
  { id: "salary", label: "Stipendio", icon: "briefcase" },
  { id: "freelance", label: "Freelance", icon: "edit-3" },
  { id: "gift", label: "Regalo", icon: "gift" },
  { id: "investment", label: "Investimento", icon: "trending-up" },
  { id: "other-in", label: "Altro", icon: "plus-circle" },
];

export const EXPENSE_CATEGORIES = [
  { id: "food", label: "Cibo", icon: "coffee" },
  { id: "transport", label: "Trasporti", icon: "truck" },
  { id: "shopping", label: "Shopping", icon: "shopping-bag" },
  { id: "bills", label: "Bollette", icon: "file-text" },
  { id: "health", label: "Salute", icon: "heart" },
  { id: "fun", label: "Svago", icon: "music" },
  { id: "home", label: "Casa", icon: "home" },
  { id: "other-out", label: "Altro", icon: "more-horizontal" },
];

export function categoryLabel(id: string): string {
  const all = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  return all.find((c) => c.id === id)?.label ?? id;
}

export function categoryIcon(id: string): string {
  const all = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  return all.find((c) => c.id === id)?.icon ?? "circle";
}
