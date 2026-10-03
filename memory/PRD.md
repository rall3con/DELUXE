# Gestore Conto — PRD

## Overview
Mobile app (Expo React Native) for personal money management with a central balance and user-created sections (pots) like Risparmi, Vacanze, Emergenze. Data lives locally on the device (AsyncStorage), no auth, no backend.

## Core features
- **Saldo totale** at top of Home: sum of all section balances.
- **Entrate** add to the selected section balance (and total).
- **Uscite** subtract from the selected section balance (and total).
- **Trasferimenti** move money between sections (no effect on total).
- **Sezioni** CRUD: create custom sections with name, target, icon, color (purple/pink/green).
- **Movimenti** list, filterable by type (Tutti / Entrate / Uscite / Trasferimenti); long-press to delete.
- **Analisi** monthly donut (entrate vs uscite) + spese per categoria breakdown.

## Design
- Dark theme (black/gray) with purple/pink/green accents, following `design_guidelines.json`.
- Hero balance card uses an abstract background image with gradient scrim.
- 4-tab bottom navigation: Home, Sezioni, Movimenti, Analisi.

## Storage
- `AsyncStorage` key `gestore_conto_state_v1`.
- Default seed: one section "Conto Principale".

## Notable files
- `src/store.ts` — state, CRUD, totals, formatting.
- `src/types.ts` — Section, Transaction, categories.
- `src/components/AddTransactionSheet.tsx` — segmented income/expense/transfer sheet.
- `src/components/AddSectionSheet.tsx` — section creator.
- `app/(tabs)/*` — screens.

## Multi-currency (added)
- Base currency is **EUR** (all amounts stored in EUR for consistency).
- User can display balances in **EUR, USD, GBP, JPY, CHF, PLN, CNY, CAD, AUD** via chip on Home and Analisi screens.
- Live rates from `api.frankfurter.dev` (free, no API key), cached 1h in AsyncStorage, pull-to-refresh button in picker.
- Inputs (new transaction amount, section target) accept values in the currently displayed currency and are converted back to EUR before storage; a hint shows the EUR equivalent when a non-EUR currency is active.

## Analisi improvements
- Month navigator (prev/next, forward disabled on current month).
- Donut shows a readable % with legend; empty state when no data.
- Currency chip in header.

## Not implemented (user chose "No AI", "No auth")
- Login / sync between devices.
- AI categorisation.
- Push notifications.

## Business enhancement idea
Add a monthly "Risparmio Challenge" widget (optional): suggest moving a small % of each income to a user-chosen savings section automatically — nudges saving behavior and increases retention.
