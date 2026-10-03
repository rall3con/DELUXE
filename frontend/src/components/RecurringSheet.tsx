import FeatherIcon from "@react-native-vector-icons/feather";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme";
import { Category, RecurFreq, RecurringRule, Section } from "@/src/types";
import { addRecurring, getActiveCategories, updateRecurring, useAppState } from "@/src/store";
import { useCurrency } from "@/src/currency";

export type RecurringSheetRef = {
  open: (existing?: RecurringRule) => void;
  close: () => void;
};

const FREQS: { id: RecurFreq; label: string }[] = [
  { id: "weekly", label: "Settimanale" },
  { id: "monthly", label: "Mensile" },
  { id: "yearly", label: "Annuale" },
];

type Props = { sections: Section[] };

export const RecurringSheet = forwardRef<RecurringSheetRef, Props>(
  function RecurringSheet({ sections }, ref) {
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

    const [editing, setEditing] = useState<RecurringRule | null>(null);
    const [type, setType] = useState<"income" | "expense">("expense");
    const [amount, setAmount] = useState("");
    const [sectionId, setSectionId] = useState<string>("main");
    const [categoryId, setCategoryId] = useState<string>("");
    const [freq, setFreq] = useState<RecurFreq>("monthly");
    const [startDate, setStartDate] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      open: (existing) => {
        setError(null);
        if (existing) {
          setEditing(existing);
          setType(existing.type);
          // Display stored EUR amount in user's currency
          const rate = currency === "EUR" ? 1 : rates?.rates[currency] ?? 1;
          const displayAmt = existing.amount * rate;
          setAmount(
            info.decimals === 0
              ? Math.round(displayAmt).toString()
              : displayAmt.toFixed(2),
          );
          setSectionId(existing.sectionId);
          setCategoryId(existing.categoryId);
          setFreq(existing.frequency);
          setStartDate(existing.startDate);
          setNote(existing.note ?? "");
        } else {
          setEditing(null);
          setType("expense");
          setAmount("");
          setSectionId(sections[0]?.id ?? "main");
          setCategoryId(expenseCats[0]?.id ?? "other-out");
          setFreq("monthly");
          setStartDate(new Date().toISOString().slice(0, 10));
          setNote("");
        }
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const snapPoints = useMemo(() => ["90%"], []);
    const renderBackdrop = useCallback(
      (p: any) => <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.7} />,
      [],
    );
    const accent =
      type === "income" ? colors.brandTertiary : colors.brandSecondary;

    const categories: Category[] = type === "income" ? incomeCats : expenseCats;

    const submit = async () => {
      setError(null);
      const n = parseFloat(amount.replace(",", "."));
      if (!n || n <= 0) return setError("Importo non valido");
      // ISO date validation
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return setError("Data inizio: usa il formato AAAA-MM-GG");
      }
      let amountEUR = n;
      if (currency !== "EUR") {
        const rate = rates?.rates[currency];
        if (!rate) return setError("Tassi di cambio non disponibili");
        amountEUR = n / rate;
      }
      if (editing) {
        await updateRecurring(editing.id, {
          type,
          amount: amountEUR,
          sectionId,
          categoryId,
          frequency: freq,
          startDate,
          note: note.trim() || undefined,
        });
      } else {
        await addRecurring({
          type,
          amount: amountEUR,
          sectionId,
          categoryId,
          frequency: freq,
          startDate,
          note: note.trim() || undefined,
        });
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
            {editing ? "Modifica ricorrenza" : "Nuova ricorrenza"}
          </Text>

          <View style={styles.segment}>
            {(["income", "expense"] as const).map((t) => (
              <Pressable
                key={t}
                testID={`rec-type-${t}`}
                onPress={() => {
                  setType(t);
                  if (t === "income") setCategoryId(incomeCats[0]?.id ?? "other-in");
                  else setCategoryId(expenseCats[0]?.id ?? "other-out");
                }}
                style={[
                  styles.segmentBtn,
                  type === t && {
                    backgroundColor:
                      (t === "income" ? colors.brandTertiary : colors.brandSecondary) + "22",
                    borderColor:
                      t === "income" ? colors.brandTertiary : colors.brandSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === t && {
                      color: t === "income" ? colors.brandTertiary : colors.brandSecondary,
                    },
                  ]}
                >
                  {t === "income" ? "Entrata" : "Uscita"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.amountWrap}>
            <Text style={styles.sym}>{info.symbol}</Text>
            <TextInput
              testID="rec-amount"
              value={amount}
              onChangeText={setAmount}
              placeholder={info.decimals === 0 ? "0" : "0,00"}
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: accent }]}
            />
          </View>

          <Text style={styles.label}>Frequenza</Text>
          <View style={styles.chipRow}>
            {FREQS.map((f) => {
              const active = freq === f.id;
              return (
                <Pressable
                  key={f.id}
                  testID={`rec-freq-${f.id}`}
                  onPress={() => setFreq(f.id)}
                  style={[
                    styles.chip,
                    active && { borderColor: accent, backgroundColor: accent + "22" },
                  ]}
                >
                  <Text style={[styles.chipText, active && { color: accent, fontWeight: "700" }]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.chipRow}>
            {categories.map((c) => {
              const active = categoryId === c.id;
              return (
                <Pressable
                  key={c.id}
                  testID={`rec-cat-${c.id}`}
                  onPress={() => setCategoryId(c.id)}
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
                  <Text style={[styles.chipText, active && { color: accent, fontWeight: "700" }]}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Sezione</Text>
          <View style={styles.chipRow}>
            {sections.map((s) => {
              const active = sectionId === s.id;
              return (
                <Pressable
                  key={s.id}
                  testID={`rec-sec-${s.id}`}
                  onPress={() => setSectionId(s.id)}
                  style={[
                    styles.chip,
                    active && { borderColor: accent, backgroundColor: accent + "22" },
                  ]}
                >
                  <Text style={[styles.chipText, active && { color: accent, fontWeight: "700" }]}>
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Data inizio (AAAA-MM-GG)</Text>
          <TextInput
            testID="rec-start"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2026-02-01"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>Nota (opzionale)</Text>
          <TextInput
            testID="rec-note"
            value={note}
            onChangeText={setNote}
            placeholder="es. Stipendio azienda"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            testID="rec-submit"
            onPress={submit}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: accent },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.submitText}>
              {editing ? "Salva" : "Crea ricorrenza"}
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
  title: { color: colors.onSurface, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm },
  segment: { flexDirection: "row", gap: spacing.sm },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  segmentText: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "600" },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: 4,
  },
  sym: { color: colors.muted, fontSize: 24 },
  amountInput: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.8,
    minWidth: 100,
    textAlign: "center",
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  chipText: { color: colors.onSurfaceSecondary, fontSize: 13 },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.onSurface,
    fontSize: 14,
  },
  error: { color: colors.error, fontSize: 13, textAlign: "center", marginTop: spacing.sm },
  submit: {
    marginTop: spacing.lg,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  submitText: { color: colors.onSurface, fontSize: 16, fontWeight: "700" },
});
