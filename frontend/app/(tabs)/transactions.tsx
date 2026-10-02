import { useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FeatherIcon from "@react-native-vector-icons/feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TransactionItem } from "@/src/components/TransactionItem";
import {
  AddTransactionSheet,
  AddTransactionSheetRef,
} from "@/src/components/AddTransactionSheet";
import { deleteTransaction, useAppState } from "@/src/store";
import { colors, radius, spacing } from "@/src/theme";
import { Transaction, TxType } from "@/src/types";

type Filter = "all" | TxType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tutti" },
  { id: "income", label: "Entrate" },
  { id: "expense", label: "Uscite" },
  { id: "transfer", label: "Trasferimenti" },
];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const state = useAppState();
  const sheetRef = useRef<AddTransactionSheetRef>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirming, setConfirming] = useState<Transaction | null>(null);

  const sectionById = useMemo(
    () => Object.fromEntries((state?.sections ?? []).map((s) => [s.id, s.name])),
    [state],
  );

  const filtered = useMemo(() => {
    if (!state) return [];
    if (filter === "all") return state.transactions;
    return state.transactions.filter((t) => t.type === filter);
  }, [state, filter]);

  if (!state) return <View style={styles.container} />;

  return (
    <View style={styles.container} testID="transactions-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Movimenti</Text>
        <Pressable
          testID="add-tx-top"
          onPress={() => sheetRef.current?.open("expense")}
          style={styles.addBtn}
        >
          <FeatherIcon name="plus" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              testID={`filter-${f.id}`}
              onPress={() => setFilter(f.id)}
              style={[
                styles.chip,
                active && {
                  backgroundColor: colors.brandPrimary + "22",
                  borderColor: colors.brandPrimary,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active && { color: colors.brandPrimary, fontWeight: "700" },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty} testID="tx-empty">
            <FeatherIcon name="inbox" size={32} color={colors.muted} />
            <Text style={styles.emptyText}>Nessun movimento</Text>
            <Text style={styles.emptySub}>
              Aggiungi la tua prima entrata o uscita
            </Text>
          </View>
        ) : (
          filtered.map((t) => (
            <TransactionItem
              key={t.id}
              tx={t}
              sectionName={sectionById[t.sectionId] ?? "—"}
              destName={t.toSectionId ? sectionById[t.toSectionId] : undefined}
              onLongPress={() => setConfirming(t)}
            />
          ))
        )}
      </ScrollView>

      {confirming && (
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Eliminare il movimento?</Text>
            <Text style={styles.confirmText}>
              Il saldo verrà ricalcolato automaticamente.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                testID="tx-confirm-cancel"
                onPress={() => setConfirming(null)}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: colors.surfaceTertiary },
                ]}
              >
                <Text style={styles.confirmBtnText}>Annulla</Text>
              </Pressable>
              <Pressable
                testID="tx-confirm-delete"
                onPress={async () => {
                  await deleteTransaction(confirming.id);
                  setConfirming(null);
                }}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: colors.brandSecondary },
                ]}
              >
                <Text style={styles.confirmBtnText}>Elimina</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <AddTransactionSheet ref={sheetRef} sections={state.sections} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    maxHeight: 56,
  },
  chipRowContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: 8,
  },
  emptyText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    color: colors.muted,
    fontSize: 13,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  confirmBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  confirmTitle: {
    color: colors.onSurface,
    fontSize: 17,
    fontWeight: "700",
  },
  confirmText: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  confirmBtnText: {
    color: colors.onSurface,
    fontWeight: "700",
    fontSize: 14,
  },
});
