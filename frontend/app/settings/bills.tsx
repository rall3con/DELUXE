import FeatherIcon from "@react-native-vector-icons/feather";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BillSheet, BillSheetRef } from "@/src/components/BillSheet";
import { severityFor } from "@/src/components/UpcomingBillBanner";
import { daysUntil, deleteBill, payBill, useAppState } from "@/src/store";
import { useCurrency } from "@/src/currency";
import { Bill } from "@/src/types";
import { colors, radius, spacing } from "@/src/theme";

const REPEAT_LABEL: Record<Bill["repeat"], string> = {
  once: "una tantum",
  monthly: "mensile",
  bimonthly: "bimestrale",
  yearly: "annuale",
};

const SEV_COLOR = {
  ok: colors.brandTertiary,
  warning: colors.warning,
  urgent: colors.brandSecondary,
  overdue: colors.brandSecondary,
};

function labelFor(bill: Bill): string {
  const d = daysUntil(bill.dueDate);
  if (d < 0) return `Scaduta da ${-d} giorni`;
  if (d === 0) return "Scade oggi";
  if (d === 1) return "Scade domani";
  return `Fra ${d} giorni`;
}

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const state = useAppState();
  const { format } = useCurrency();
  const sheetRef = useRef<BillSheetRef>(null);
  const [confirming, setConfirming] = useState<Bill | null>(null);

  const [active, archived] = useMemo(() => {
    const b = state?.bills ?? [];
    const a = b.filter((x) => !x.archived).sort((x, y) => x.dueDate.localeCompare(y.dueDate));
    const z = b.filter((x) => x.archived).sort((x, y) => y.dueDate.localeCompare(x.dueDate));
    return [a, z];
  }, [state]);

  if (!state) return <View style={styles.container} />;

  return (
    <View style={styles.container} testID="bills-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable testID="bill-back" onPress={() => router.back()} style={styles.backBtn}>
          <FeatherIcon name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Scadenze</Text>
        <Pressable
          testID="bill-add"
          onPress={() => sheetRef.current?.open()}
          style={styles.addBtn}
        >
          <FeatherIcon name="plus" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {active.length === 0 && archived.length === 0 ? (
          <View style={styles.empty}>
            <FeatherIcon name="calendar" size={28} color={colors.muted} />
            <Text style={styles.emptyTitle}>Nessuna scadenza</Text>
            <Text style={styles.emptySub}>
              Aggiungi bollette, affitto, rate. Alla prossima apertura dell'app
              vedrai un banner in Home per le scadenze dei prossimi 7 giorni.
            </Text>
            <Pressable
              testID="bill-empty-add"
              onPress={() => sheetRef.current?.open()}
              style={styles.cta}
            >
              <FeatherIcon name="plus" size={16} color={colors.brandPrimary} />
              <Text style={styles.ctaText}>Aggiungi scadenza</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <Text style={styles.sectionLabel}>Attive</Text>
            )}
            {active.map((b) => {
              const sev = severityFor(b);
              const accent = SEV_COLOR[sev];
              return (
                <Pressable
                  key={b.id}
                  testID={`bill-item-${b.id}`}
                  onPress={() => sheetRef.current?.open(b)}
                  style={({ pressed }) => [
                    styles.row,
                    { borderColor: accent + "44" },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: accent + "22", borderColor: accent + "44" },
                    ]}
                  >
                    <FeatherIcon
                      name={sev === "overdue" ? "alert-triangle" : "clock"}
                      size={18}
                      color={accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{b.name}</Text>
                    <Text style={[styles.rowSub, { color: accent }]}>
                      {labelFor(b)} · {REPEAT_LABEL[b.repeat]}
                    </Text>
                    {b.amount ? (
                      <Text style={styles.amount}>{format(b.amount)}</Text>
                    ) : null}
                  </View>
                  <View style={styles.actions}>
                    {b.amount ? (
                      <Pressable
                        testID={`bill-pay-${b.id}`}
                        onPress={() => payBill(b.id, { createExpense: true })}
                        style={[styles.payBtn, { backgroundColor: accent }]}
                      >
                        <Text style={styles.payText}>Paga</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        testID={`bill-mark-${b.id}`}
                        onPress={() => payBill(b.id, { createExpense: false })}
                        style={[styles.payBtn, { backgroundColor: colors.surfaceTertiary }]}
                      >
                        <Text style={[styles.payText, { color: colors.onSurface }]}>
                          Fatto
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      testID={`bill-del-${b.id}`}
                      onPress={() => setConfirming(b)}
                      style={styles.deleteIcon}
                    >
                      <FeatherIcon name="trash-2" size={14} color={colors.brandSecondary} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            {archived.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Archiviate</Text>
                {archived.map((b) => (
                  <View key={b.id} style={[styles.row, { opacity: 0.6 }]}>
                    <View style={[styles.iconWrap, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
                      <FeatherIcon name="check-circle" size={18} color={colors.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{b.name}</Text>
                      <Text style={styles.rowSub}>
                        {b.dueDate} · pagata
                      </Text>
                    </View>
                    <Pressable
                      testID={`bill-del-${b.id}`}
                      onPress={() => setConfirming(b)}
                      style={styles.deleteIcon}
                    >
                      <FeatherIcon name="trash-2" size={14} color={colors.brandSecondary} />
                    </Pressable>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <BillSheet ref={sheetRef} sections={state.sections} />

      {confirming && (
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Eliminare "{confirming.name}"?</Text>
            <Text style={styles.confirmText}>
              La scadenza sarà rimossa definitivamente. I movimenti già pagati
              rimangono.
            </Text>
            <View style={styles.rowCta}>
              <Pressable
                testID="bill-del-cancel"
                onPress={() => setConfirming(null)}
                style={[styles.btn, { backgroundColor: colors.surfaceTertiary }]}
              >
                <Text style={styles.btnText}>Annulla</Text>
              </Pressable>
              <Pressable
                testID="bill-del-confirm"
                onPress={async () => {
                  await deleteBill(confirming.id);
                  setConfirming(null);
                }}
                style={[styles.btn, { backgroundColor: colors.brandSecondary }]}
              >
                <Text style={styles.btnText}>Elimina</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.onSurface, fontSize: 20, fontWeight: "800" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  emptySub: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.brandPrimary + "66",
    backgroundColor: colors.brandPrimary + "11",
    marginTop: spacing.sm,
  },
  ctaText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 13 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "700" },
  rowSub: { fontSize: 11, marginTop: 2, fontWeight: "600" },
  amount: { color: colors.onSurface, fontSize: 13, fontWeight: "700", marginTop: 4 },
  actions: { gap: 6, alignItems: "flex-end" },
  payBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  payText: { color: "#000", fontSize: 12, fontWeight: "800" },
  deleteIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSecondary + "11",
    alignItems: "center",
    justifyContent: "center",
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
  confirmTitle: { color: colors.onSurface, fontSize: 17, fontWeight: "700" },
  confirmText: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 18 },
  rowCta: { flexDirection: "row", gap: spacing.sm },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnText: { color: colors.onSurface, fontWeight: "700", fontSize: 14 },
});
