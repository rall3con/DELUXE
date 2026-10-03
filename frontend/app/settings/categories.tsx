import FeatherIcon from "@react-native-vector-icons/feather";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CategorySheet,
  CategorySheetRef,
} from "@/src/components/CategorySheet";
import { deleteCategory, useAppState } from "@/src/store";
import { Category, CategoryType } from "@/src/types";
import { colors, radius, spacing } from "@/src/theme";

const COLOR_MAP: Record<string, string> = {
  green: colors.brandTertiary,
  pink: colors.brandSecondary,
  purple: colors.brandPrimary,
  orange: colors.warning,
  blue: colors.info,
  aqua: "#5EE6B8",
  lilac: "#8E6CFF",
  rose: "#FF6AB1",
};

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const state = useAppState();
  const sheetRef = useRef<CategorySheetRef>(null);
  const [filter, setFilter] = useState<CategoryType>("expense");
  const [confirming, setConfirming] = useState<Category | null>(null);

  const items = useMemo(() => {
    if (!state) return [];
    return state.categories
      .filter((c) => c.type === filter && !c.archived)
      .sort((a, b) => a.order - b.order);
  }, [state, filter]);

  if (!state) return <View style={styles.container} />;

  return (
    <View style={styles.container} testID="categories-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable
          testID="cat-back"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <FeatherIcon name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Categorie</Text>
        <Pressable
          testID="cat-add"
          onPress={() => sheetRef.current?.open(filter)}
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
        {(["expense", "income"] as CategoryType[]).map((t) => {
          const active = filter === t;
          return (
            <Pressable
              key={t}
              testID={`cat-filter-${t}`}
              onPress={() => setFilter(t)}
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
                {t === "expense" ? "Uscite" : "Entrate"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {items.map((c) => {
          const hex = COLOR_MAP[c.color] ?? colors.brandPrimary;
          return (
            <Pressable
              key={c.id}
              testID={`cat-row-${c.id}`}
              onPress={() => sheetRef.current?.open(c.type, c)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: hex + "22", borderColor: hex + "44" },
                ]}
              >
                <FeatherIcon name={c.icon as any} size={18} color={hex} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{c.name}</Text>
                <Text style={styles.rowSub}>
                  {c.builtIn ? "Predefinita · modificabile" : "Personalizzata"}
                </Text>
              </View>
              <FeatherIcon name="edit-2" size={16} color={colors.muted} />
              {!c.builtIn && (
                <Pressable
                  testID={`cat-delete-${c.id}`}
                  onPress={() => setConfirming(c)}
                  style={styles.deleteBtn}
                >
                  <FeatherIcon
                    name="trash-2"
                    size={16}
                    color={colors.brandSecondary}
                  />
                </Pressable>
              )}
            </Pressable>
          );
        })}

        <Pressable
          testID="cat-add-cta"
          onPress={() => sheetRef.current?.open(filter)}
          style={styles.cta}
        >
          <FeatherIcon name="plus-circle" size={18} color={colors.brandPrimary} />
          <Text style={styles.ctaText}>
            Nuova categoria {filter === "expense" ? "uscita" : "entrata"}
          </Text>
        </Pressable>

        <Text style={styles.hint}>
          Le categorie predefinite non possono essere eliminate per lasciarti sempre
          una base da cui partire, ma puoi modificare nome, icona e colore.
        </Text>
      </ScrollView>

      <CategorySheet ref={sheetRef} />

      {confirming && (
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Eliminare "{confirming.name}"?</Text>
            <Text style={styles.confirmText}>
              Se ci sono movimenti collegati, verrà archiviata e appariranno come
              "(archiviata)". Altrimenti verrà rimossa.
            </Text>
            <View style={styles.rowCta}>
              <Pressable
                testID="cat-del-cancel"
                onPress={() => setConfirming(null)}
                style={[styles.btn, { backgroundColor: colors.surfaceTertiary, flex: 1 }]}
              >
                <Text style={styles.btnText}>Annulla</Text>
              </Pressable>
              <Pressable
                testID="cat-del-confirm"
                onPress={async () => {
                  await deleteCategory(confirming.id);
                  setConfirming(null);
                }}
                style={[styles.btn, { backgroundColor: colors.brandSecondary, flex: 1 }]}
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
  chipRow: { maxHeight: 56 },
  chipRowContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexShrink: 0,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
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
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
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
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandSecondary + "11",
    borderWidth: 1,
    borderColor: colors.brandSecondary + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.brandPrimary + "66",
    backgroundColor: colors.brandPrimary + "11",
    marginTop: spacing.sm,
  },
  ctaText: { color: colors.brandPrimary, fontWeight: "600", fontSize: 13 },
  hint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    lineHeight: 16,
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
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnText: { color: colors.onSurface, fontWeight: "700", fontSize: 14 },
});
