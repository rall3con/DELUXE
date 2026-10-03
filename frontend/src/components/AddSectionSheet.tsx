import FeatherIcon from "@react-native-vector-icons/feather";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "@/src/theme";
import { addSection } from "@/src/store";
import { useCurrency } from "@/src/currency";

export type AddSectionSheetRef = {
  open: () => void;
  close: () => void;
};

const ICONS = ["credit-card", "star", "heart", "home", "briefcase", "gift", "umbrella", "zap", "shield", "trending-up"];
const COLORS: Array<"purple" | "pink" | "green"> = ["purple", "pink", "green"];
const COLOR_HEX = {
  purple: colors.brandPrimary,
  pink: colors.brandSecondary,
  green: colors.brandTertiary,
};

export const AddSectionSheet = forwardRef<AddSectionSheetRef, {}>(
  function AddSectionSheet(_, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { info, currency, rates } = useCurrency();
    const [name, setName] = useState("");
    const [target, setTarget] = useState("");
    const [icon, setIcon] = useState("star");
    const [color, setColor] = useState<"purple" | "pink" | "green">("purple");
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        setName("");
        setTarget("");
        setIcon("star");
        setColor("purple");
        setError(null);
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const snapPoints = useMemo(() => ["80%"], []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.7}
        />
      ),
      [],
    );

    const handleSubmit = useCallback(async () => {
      setError(null);
      if (!name.trim()) {
        setError("Inserisci un nome");
        return;
      }
      let t = target.trim() ? parseFloat(target.replace(",", ".")) : undefined;
      // target entered in displayed currency; convert to EUR for storage
      if (t && currency !== "EUR") {
        const rate = rates?.rates[currency];
        if (!rate || rate <= 0) {
          setError("Tassi di cambio non disponibili");
          return;
        }
        t = t / rate;
      }
      await addSection({
        name: name.trim(),
        icon,
        color,
        target: t && t > 0 ? t : undefined,
      });
      sheetRef.current?.dismiss();
    }, [name, target, icon, color, currency, rates]);

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
          <Text style={styles.title}>Nuova Sezione</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            testID="section-name-input"
            value={name}
            onChangeText={setName}
            placeholder="es. Risparmi Vacanza"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Obiettivo (opzionale, {info.symbol})</Text>
          <TextInput
            testID="section-target-input"
            value={target}
            onChangeText={setTarget}
            placeholder={info.decimals === 0 ? "es. 1000" : "es. 1000"}
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Icona</Text>
          <View style={styles.row}>
            {ICONS.map((i) => {
              const active = icon === i;
              return (
                <Pressable
                  key={i}
                  testID={`icon-${i}`}
                  onPress={() => setIcon(i)}
                  style={[
                    styles.iconBtn,
                    active && {
                      borderColor: COLOR_HEX[color],
                      backgroundColor: COLOR_HEX[color] + "22",
                    },
                  ]}
                >
                  <FeatherIcon
                    name={i as any}
                    size={18}
                    color={active ? COLOR_HEX[color] : colors.onSurfaceSecondary}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Colore</Text>
          <View style={styles.row}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                testID={`color-${c}`}
                onPress={() => setColor(c)}
                style={[
                  styles.colorBtn,
                  { backgroundColor: COLOR_HEX[c] },
                  color === c && styles.colorBtnActive,
                ]}
              />
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            testID="section-submit"
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: COLOR_HEX[color] },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.submitText}>Crea Sezione</Text>
          </Pressable>
          <View style={{ height: 24 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
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
  row: {
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
    width: 44,
    height: 44,
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
