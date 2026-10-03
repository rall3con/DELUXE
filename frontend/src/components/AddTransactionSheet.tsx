import FeatherIcon from "@react-native-vector-icons/feather";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radius, spacing } from "@/src/theme";
import {
  Category,
  Section,
  TxType,
} from "@/src/types";
import { addTransaction, getActiveCategories, useAppState } from "@/src/store";
import { convertFromEUR, useCurrency } from "@/src/currency";

export type AddTransactionSheetRef = {
  open: (type: TxType) => void;
  close: () => void;
};

type Props = {
  sections: Section[];
};

export const AddTransactionSheet = forwardRef<AddTransactionSheetRef, Props>(
  function AddTransactionSheet({ sections }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { info, rates, currency } = useCurrency();
    const state = useAppState();
    const incomeCats = useMemo(
      () => (state ? getActiveCategories(state, "income") : []),
      [state],
    );
    const expenseCats = useMemo(
      () => (state ? getActiveCategories(state, "expense") : []),
      [state],
    );
    const [type, setType] = useState<TxType>("expense");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>(sections[0]?.id ?? "main");
    const [toSectionId, setToSectionId] = useState<string>(
      sections.find((s) => s.id !== sections[0]?.id)?.id ?? "",
    );
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useImperativeHandle(ref, () => ({
      open: (t: TxType) => {
        setType(t);
        setAmount("");
        setNote("");
        setError(null);
        const firstIncomeId = incomeCats[0]?.id ?? "other-in";
        const firstExpenseId = expenseCats[0]?.id ?? "other-out";
        setCategory(t === "income" ? firstIncomeId : firstExpenseId);
        setSectionId(sections[0]?.id ?? "main");
        setToSectionId(sections.find((s) => s.id !== sections[0]?.id)?.id ?? "");
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const snapPoints = useMemo(() => ["85%"], []);
    const categories: Category[] = type === "income" ? incomeCats : expenseCats;

    const accent =
      type === "income"
        ? colors.brandTertiary
        : type === "expense"
        ? colors.brandSecondary
        : colors.brandPrimary;

    const title =
      type === "income"
        ? "Nuova Entrata"
        : type === "expense"
        ? "Nuova Uscita"
        : "Trasferimento";

    const handleSubmit = useCallback(async () => {
      setError(null);
      const n = parseFloat(amount.replace(",", "."));
      if (!n || n <= 0) {
        setError("Inserisci un importo valido");
        return;
      }
      // User enters amount in selected currency; convert back to EUR for storage
      let amountEUR = n;
      if (currency !== "EUR") {
        const rate = rates?.rates[currency];
        if (!rate || rate <= 0) {
          setError("Tassi di cambio non disponibili");
          return;
        }
        amountEUR = n / rate;
      }
      setSubmitting(true);
      const res = await addTransaction({
        type,
        amount: amountEUR,
        category: type === "transfer" ? "transfer" : category,
        note: note.trim() || undefined,
        sectionId,
        toSectionId: type === "transfer" ? toSectionId : undefined,
      });
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error ?? "Errore");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      sheetRef.current?.dismiss();
    }, [amount, category, note, sectionId, toSectionId, type, currency, rates]);

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
          <Text style={styles.title} testID="tx-sheet-title">{title}</Text>

          {/* Type toggle */}
          <View style={styles.segment}>
            {(["income", "expense", "transfer"] as TxType[]).map((t) => (
              <Pressable
                key={t}
                testID={`type-${t}`}
                onPress={() => {
                  setType(t);
                  if (t === "income") setCategory(incomeCats[0]?.id ?? "other-in");
                  if (t === "expense") setCategory(expenseCats[0]?.id ?? "other-out");
                }}
                style={[
                  styles.segmentBtn,
                  type === t && {
                    backgroundColor:
                      t === "income"
                        ? colors.brandTertiary + "22"
                        : t === "expense"
                        ? colors.brandSecondary + "22"
                        : colors.brandPrimary + "22",
                    borderColor:
                      t === "income"
                        ? colors.brandTertiary
                        : t === "expense"
                        ? colors.brandSecondary
                        : colors.brandPrimary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === t && {
                      color:
                        t === "income"
                          ? colors.brandTertiary
                          : t === "expense"
                          ? colors.brandSecondary
                          : colors.brandPrimary,
                    },
                  ]}
                >
                  {t === "income" ? "Entrata" : t === "expense" ? "Uscita" : "Trasferisci"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amount */}
          <View style={styles.amountWrap}>
            <Text style={styles.euroSign}>{info.symbol}</Text>
            <TextInput
              testID="tx-amount-input"
              value={amount}
              onChangeText={setAmount}
              placeholder={info.decimals === 0 ? "0" : "0,00"}
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: accent }]}
            />
          </View>
          {currency !== "EUR" && amount && !isNaN(parseFloat(amount.replace(",", "."))) && rates && (
            <Text style={styles.conversionHint} testID="tx-conversion-hint">
              ≈ €
              {(
                parseFloat(amount.replace(",", ".")) /
                (rates.rates[currency] || 1)
              ).toLocaleString("it-IT", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              salvato in Euro
            </Text>
          )}

          {/* Category (only for income/expense) */}
          {type !== "transfer" && (
            <>
              <Text style={styles.sectionTitle}>Categoria</Text>
              <View style={styles.chipRow}>
                {categories.map((c) => {
                  const active = category === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      testID={`category-${c.id}`}
                      onPress={() => setCategory(c.id)}
                      style={[
                        styles.chip,
                        active && { borderColor: accent, backgroundColor: accent + "22" },
                      ]}
                    >
                      <FeatherIcon
                        name={c.icon as any}
                        size={14}
                        color={active ? accent : colors.onSurfaceSecondary}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          active && { color: accent, fontWeight: "700" },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Section selector */}
          <Text style={styles.sectionTitle}>
            {type === "transfer" ? "Dalla sezione" : "Sezione"}
          </Text>
          <View style={styles.chipRow}>
            {sections.map((s) => {
              const active = sectionId === s.id;
              return (
                <Pressable
                  key={s.id}
                  testID={`section-pick-from-${s.id}`}
                  onPress={() => setSectionId(s.id)}
                  style={[
                    styles.chip,
                    active && { borderColor: accent, backgroundColor: accent + "22" },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && { color: accent, fontWeight: "700" },
                    ]}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {type === "transfer" && (
            <>
              <Text style={styles.sectionTitle}>Alla sezione</Text>
              <View style={styles.chipRow}>
                {sections
                  .filter((s) => s.id !== sectionId)
                  .map((s) => {
                    const active = toSectionId === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        testID={`section-pick-to-${s.id}`}
                        onPress={() => setToSectionId(s.id)}
                        style={[
                          styles.chip,
                          active && {
                            borderColor: accent,
                            backgroundColor: accent + "22",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && { color: accent, fontWeight: "700" },
                          ]}
                        >
                          {s.name}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            </>
          )}

          {/* Note */}
          <Text style={styles.sectionTitle}>Nota (opzionale)</Text>
          <TextInput
            testID="tx-note-input"
            value={note}
            onChangeText={setNote}
            placeholder="es. Pranzo con amici"
            placeholderTextColor={colors.muted}
            style={styles.noteInput}
          />

          {error && (
            <Text style={styles.error} testID="tx-error">{error}</Text>
          )}

          <Pressable
            testID="tx-submit"
            disabled={submitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: accent },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.submitText}>
              {submitting ? "Salvataggio…" : "Salva"}
            </Text>
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
    gap: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  segment: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  segmentText: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: 4,
  },
  euroSign: {
    color: colors.muted,
    fontSize: 28,
    fontWeight: "500",
  },
  amountInput: {
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: -1,
    minWidth: 100,
    textAlign: "center",
  },
  conversionHint: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: -spacing.sm,
    fontStyle: "italic",
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  chipText: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
  },
  noteInput: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.onSurface,
    fontSize: 14,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: "center",
  },
  submit: {
    marginTop: spacing.md,
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
