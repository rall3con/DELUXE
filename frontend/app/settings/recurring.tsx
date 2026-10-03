import FeatherIcon from "@react-native-vector-icons/feather";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  RecurringSheet,
  RecurringSheetRef,
} from "@/src/components/RecurringSheet";
import { deleteRecurring, updateRecurring, useAppState } from "@/src/store";
import { useCurrency } from "@/src/currency";
import { RecurringRule } from "@/src/types";
import { resolveCategory } from "@/src/types";
import { colors, radius, spacing } from "@/src/theme";

const FREQ_LABEL: Record<RecurringRule["frequency"], string> = {
  weekly: "ogni settimana",
  monthly: "ogni mese",
  yearly: "ogni anno",
};

export default function RecurringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const state = useAppState();
  const { format } = useCurrency();
  const sheetRef = useRef<RecurringSheetRef>(null);
  const [confirming, setConfirming] = useState<RecurringRule | null>(null);

  const rules = useMemo(() => state?.recurring ?? [], [state]);
  const sections = state?.sections ?? [];
  const sectionById = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s.name])),
    [sections],
  );

  if (!state) return <View style={styles.container} />;

  return (
    <View style={styles.container} testID="recurring-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable testID="rec-back" onPress={() => router.back()} style={styles.backBtn}>
          <FeatherIcon name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Ricorrenti</Text>
        <Pressable
          testID="rec-add"
          onPress={() => sheetRef.current?.open()}
          style={styles.addBtn}
        >
          <FeatherIcon name="plus" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {rules.length === 0 ? (
          <View style={styles.empty}>
            <FeatherIcon name="repeat" size={28} color={colors.muted} />
            <Text style={styles.emptyTitle}>Nessuna ricorrenza</Text>
            <Text style={styles.emptySub}>
              Automatizza stipendi, affitti, abbonamenti. Alla prossima apertura
              dell'app, i movimenti saranno già inseriti.
            </Text>
            <Pressable
              testID="rec-empty-add"
              onPress={() => sheetRef.current?.open()}
              style={styles.cta}
            >
              <FeatherIcon name="plus" size={16} color={colors.brandPrimary} />
              <Text style={styles.ctaText}>Crea la prima regola</Text>
            </Pressable>
          </View>
        ) : (
          rules.map((r) => {
            const cat = resolveCategory(r.categoryId, state.categories);
            const accent =
              r.type === "income" ? colors.brandTertiary : colors.brandSecondary;
            return (
              <Pressable
                key={r.id}
                testID={`rec-item-${r.id}`}
                onPress={() => sheetRef.current?.open(r)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: accent + "22", borderColor: accent + "44" },
                  ]}
                >
                  <FeatherIcon name={cat.icon as any} size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {r.note || cat.name}
                  </Text>
                  <Text style={styles.rowSub}>
                    {cat.name} · {FREQ_LABEL[r.frequency]} · {sectionById[r.sectionId] ?? "?"}
                  </Text>
                  <Text style={[styles.amount, { color: accent }]}>
                    {r.type === "income" ? "+" : "-"}
                    {format(r.amount).replace("-", "")}
                  </Text>
                  {r.paused && (
                    <Text style={styles.pausedTag}>In pausa</Text>
                  )}
                </View>
                <View style={styles.actions}>
                  <Pressable
                    testID={`rec-pause-${r.id}`}
                    onPress={() => updateRecurring(r.id, { paused: !r.paused })}
                    style={styles.iconBtn}
                  >
                    <FeatherIcon
                      name={r.paused ? "play" : "pause"}
                      size={14}
                      color={colors.onSurface}
                    />
                  </Pressable>
                  <Pressable
                    testID={`rec-del-${r.id}`}
                    onPress={() => setConfirming(r)}
                    style={[styles.iconBtn, { backgroundColor: colors.brandSecondary + "22" }]}
                  >
                    <FeatherIcon name="trash-2" size={14} color={colors.brandSecondary} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <RecurringSheet ref={sheetRef} sections={sections} />

      {confirming && (
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Eliminare la ricorrenza?</Text>
            <Text style={styles.confirmText}>
              I movimenti già creati rimarranno. Non ne verranno più generati.
            </Text>
            <View style={styles.rowCta}>
              <Pressable
                testID="rec-del-cancel"
                onPress={() => setConfirming(null)}
                style={[styles.btn, { backgroundColor: colors.surfaceTertiary }]}
              >
                <Text style={styles.btnText}>Annulla</Text>
              </Pressable>
              <Pressable
                testID="rec-del-confirm"
                onPress={async () => {
                  await deleteRecurring(confirming.id);
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
    backgroundColor: colors.brandPrimary,
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
  rowSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "800", marginTop: 4 },
  pausedTag: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actions: { gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
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
