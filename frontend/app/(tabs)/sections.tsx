import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FeatherIcon from "@react-native-vector-icons/feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SectionCard } from "@/src/components/SectionCard";
import {
  AddSectionSheet,
  AddSectionSheetRef,
} from "@/src/components/AddSectionSheet";
import { deleteSection, useAppState } from "@/src/store";
import { useCurrency } from "@/src/currency";
import { colors, radius, spacing } from "@/src/theme";
import { Section } from "@/src/types";

export default function SectionsScreen() {
  const insets = useSafeAreaInsets();
  const state = useAppState();
  const { format } = useCurrency();
  const sheetRef = useRef<AddSectionSheetRef>(null);
  const [confirming, setConfirming] = useState<Section | null>(null);

  if (!state) return <View style={styles.container} />;

  return (
    <View style={styles.container} testID="sections-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Sezioni</Text>
        <Pressable
          testID="add-section-top"
          onPress={() => sheetRef.current?.open()}
          style={styles.addBtn}
        >
          <FeatherIcon name="plus" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {state.sections.map((s) => (
          <View key={s.id} style={styles.row}>
            <View style={styles.cardWrap}>
              <SectionCard section={s} compact />
            </View>
            {s.id !== "main" && (
              <Pressable
                testID={`delete-section-${s.id}`}
                onPress={() => setConfirming(s)}
                style={styles.deleteBtn}
              >
                <FeatherIcon
                  name="trash-2"
                  size={18}
                  color={colors.brandSecondary}
                />
                <Text style={styles.deleteText}>Elimina</Text>
              </Pressable>
            )}
          </View>
        ))}

        <Pressable
          testID="empty-add-section"
          onPress={() => sheetRef.current?.open()}
          style={styles.newCta}
        >
          <FeatherIcon name="plus-circle" size={20} color={colors.brandPrimary} />
          <Text style={styles.newCtaText}>Crea nuova sezione</Text>
        </Pressable>
      </ScrollView>

      {confirming && (
        <View style={styles.overlay} testID="confirm-overlay">
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Eliminare la sezione?</Text>
            <Text style={styles.confirmText}>
              Il saldo di "{confirming.name}" ({format(confirming.balance)})
              verrà spostato in "Conto Principale". Tutti i movimenti collegati
              saranno rimossi.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                testID="confirm-cancel"
                onPress={() => setConfirming(null)}
                style={[styles.confirmBtn, { backgroundColor: colors.surfaceTertiary }]}
              >
                <Text style={styles.confirmBtnText}>Annulla</Text>
              </Pressable>
              <Pressable
                testID="confirm-delete"
                onPress={async () => {
                  await deleteSection(confirming.id);
                  setConfirming(null);
                }}
                style={[styles.confirmBtn, { backgroundColor: colors.brandSecondary }]}
              >
                <Text style={styles.confirmBtnText}>Elimina</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <AddSectionSheet ref={sheetRef} />
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
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "stretch",
  },
  cardWrap: {
    flex: 1,
  },
  deleteBtn: {
    width: 72,
    borderRadius: radius.md,
    backgroundColor: colors.brandSecondary + "11",
    borderWidth: 1,
    borderColor: colors.brandSecondary + "33",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  deleteText: {
    color: colors.brandSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  newCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.brandPrimary + "66",
    backgroundColor: colors.brandPrimary + "11",
    marginTop: spacing.sm,
  },
  newCtaText: {
    color: colors.brandPrimary,
    fontWeight: "600",
    fontSize: 14,
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
