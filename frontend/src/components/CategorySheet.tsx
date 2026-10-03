import FeatherIcon from "@react-native-vector-icons/feather";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme";
import { Category, CategoryType } from "@/src/types";
import { addCategory, updateCategory } from "@/src/store";

export type CategorySheetRef = {
  open: (type: CategoryType, existing?: Category) => void;
  close: () => void;
};

const ICONS = [
  "shopping-bag",
  "coffee",
  "truck",
  "file-text",
  "heart",
  "music",
  "home",
  "briefcase",
  "edit-3",
  "gift",
  "trending-up",
  "star",
  "zap",
  "smile",
  "book",
  "camera",
  "cpu",
  "wifi",
  "map-pin",
  "activity",
];

const COLOR_OPTIONS: { key: string; hex: string }[] = [
  { key: "green", hex: colors.brandTertiary },
  { key: "pink", hex: colors.brandSecondary },
  { key: "purple", hex: colors.brandPrimary },
  { key: "orange", hex: colors.warning },
  { key: "blue", hex: colors.info },
  { key: "aqua", hex: "#5EE6B8" },
  { key: "lilac", hex: "#8E6CFF" },
  { key: "rose", hex: "#FF6AB1" },
];

export const CategorySheet = forwardRef<CategorySheetRef, {}>(
  function CategorySheet(_, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [editing, setEditing] = useState<Category | null>(null);
    const [type, setType] = useState<CategoryType>("expense");
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("star");
    const [color, setColor] = useState<string>("purple");
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      open: (t, existing) => {
        setError(null);
        setType(t);
        setEditing(existing ?? null);
        setName(existing?.name ?? "");
        setIcon(existing?.icon ?? "star");
        setColor(existing?.color ?? (t === "income" ? "green" : "pink"));
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const snapPoints = useMemo(() => ["80%"], []);
    const renderBackdrop = useCallback(
      (p: any) => <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.7} />,
      [],
    );

    const accent =
      COLOR_OPTIONS.find((c) => c.key === color)?.hex ?? colors.brandPrimary;

    const submit = async () => {
      setError(null);
      if (!name.trim()) {
        setError("Inserisci un nome");
        return;
      }
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), icon, color });
      } else {
        await addCategory({ name: name.trim(), icon, color, type });
      }
      sheetRef.current?.dismiss();
    };

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surfaceSecondary }}
        handleIndicatorStyle={{ backgroundColor: colors.muted }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {editing ? "Modifica categoria" : "Nuova categoria"}
          </Text>
          <Text style={styles.badge}>
            {type === "income" ? "Entrata" : "Uscita"}
          </Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            testID="cat-name-input"
            value={name}
            onChangeText={setName}
            placeholder="es. Palestra"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Icona</Text>
          <View style={styles.grid}>
            {ICONS.map((i) => {
              const active = icon === i;
              return (
                <Pressable
                  key={i}
                  testID={`cat-icon-${i}`}
                  onPress={() => setIcon(i)}
                  style={[
                    styles.iconBtn,
                    active && { borderColor: accent, backgroundColor: accent + "22" },
                  ]}
                >
                  <FeatherIcon
                    name={i as any}
                    size={18}
                    color={active ? accent : colors.onSurfaceSecondary}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Colore</Text>
          <View style={styles.grid}>
            {COLOR_OPTIONS.map((c) => (
              <Pressable
                key={c.key}
                testID={`cat-color-${c.key}`}
                onPress={() => setColor(c.key)}
                style={[
                  styles.colorBtn,
                  { backgroundColor: c.hex },
                  color === c.key && styles.colorBtnActive,
                ]}
              />
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            testID="cat-submit"
            onPress={submit}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: accent },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.submitText}>
              {editing ? "Salva modifiche" : "Crea categoria"}
            </Text>
          </Pressable>
          <View style={{ height: 24 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  title: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  badge: {
    alignSelf: "flex-start",
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: colors.onSurface,
    fontSize: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorBtnActive: {
    borderColor: colors.onSurface,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.lg,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  submitText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
  },
});
