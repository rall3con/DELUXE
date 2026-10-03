import FeatherIcon from "@react-native-vector-icons/feather";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme";
import { Bill, BillRepeat, Section } from "@/src/types";
import { addBill, updateBill } from "@/src/store";
import { useCurrency } from "@/src/currency";

export type BillSheetRef = {
  open: (existing?: Bill) => void;
  close: () => void;
};

const REPEATS: { id: BillRepeat; label: string }[] = [
  { id: "once", label: "Una volta" },
  { id: "monthly", label: "Mensile" },
  { id: "bimonthly", label: "Bimestrale" },
  { id: "yearly", label: "Annuale" },
];

type Props = { sections: Section[] };

export const BillSheet = forwardRef<BillSheetRef, Props>(
  function BillSheet({ sections }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { info, rates, currency } = useCurrency();
    const [editing, setEditing] = useState<Bill | null>(null);
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [sectionId, setSectionId] = useState<string>("");
    const [dueDate, setDueDate] = useState("");
    const [repeat, setRepeat] = useState<BillRepeat>("monthly");
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      open: (existing) => {
        setError(null);
        if (existing) {
          setEditing(existing);
          setName(existing.name);
          if (existing.amount) {
            const rate = currency === "EUR" ? 1 : rates?.rates[currency] ?? 1;
            const displayAmt = existing.amount * rate;
            setAmount(info.decimals === 0 ? Math.round(displayAmt).toString() : displayAmt.toFixed(2));
          } else {
            setAmount("");
          }
          setSectionId(existing.sectionId ?? "");
          setDueDate(existing.dueDate);
          setRepeat(existing.repeat);
        } else {
          setEditing(null);
          setName("");
          setAmount("");
          setSectionId("");
          setDueDate(new Date().toISOString().slice(0, 10));
          setRepeat("monthly");
        }
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const snapPoints = useMemo(() => ["85%"], []);
    const renderBackdrop = useCallback(
      (p: any) => <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.7} />,
      [],
    );

    const submit = async () => {
      setError(null);
      if (!name.trim()) return setError("Inserisci un nome");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
        return setError("Data: usa il formato AAAA-MM-GG");
      let amountEUR: number | undefined;
      if (amount.trim()) {
        const n = parseFloat(amount.replace(",", "."));
        if (!n || n <= 0) return setError("Importo non valido");
        amountEUR = n;
        if (currency !== "EUR") {
          const rate = rates?.rates[currency];
          if (!rate) return setError("Tassi di cambio non disponibili");
          amountEUR = n / rate;
        }
      }
      if (editing) {
        await updateBill(editing.id, {
          name: name.trim(),
          amount: amountEUR,
          sectionId: sectionId || undefined,
          dueDate,
          repeat,
        });
      } else {
        await addBill({
          name: name.trim(),
          amount: amountEUR,
          sectionId: sectionId || undefined,
          dueDate,
          repeat,
        });
      }
      sheetRef.current?.dismiss();
    };

    const accent = colors.warning;

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
            {editing ? "Modifica scadenza" : "Nuova scadenza"}
          </Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            testID="bill-name"
            value={name}
            onChangeText={setName}
            placeholder="es. Bolletta luce"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Importo (opzionale, {info.symbol})</Text>
          <TextInput
            testID="bill-amount"
            value={amount}
            onChangeText={setAmount}
            placeholder={info.decimals === 0 ? "es. 50" : "es. 50,00"}
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Data scadenza (AAAA-MM-GG)</Text>
          <TextInput
            testID="bill-date"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-03-15"
            autoCapitalize="none"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Ripetizione</Text>
          <View style={styles.chipRow}>
            {REPEATS.map((r) => {
              const active = repeat === r.id;
              return (
                <Pressable
                  key={r.id}
                  testID={`bill-repeat-${r.id}`}
                  onPress={() => setRepeat(r.id)}
                  style={[
                    styles.chip,
                    active && { borderColor: accent, backgroundColor: accent + "22" },
                  ]}
                >
                  <Text style={[styles.chipText, active && { color: accent, fontWeight: "700" }]}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Sezione da cui pagare (opzionale)</Text>
          <View style={styles.chipRow}>
            <Pressable
              testID="bill-sec-none"
              onPress={() => setSectionId("")}
              style={[
                styles.chip,
                sectionId === "" && { borderColor: accent, backgroundColor: accent + "22" },
              ]}
            >
              <Text style={[styles.chipText, sectionId === "" && { color: accent, fontWeight: "700" }]}>
                Nessuna
              </Text>
            </Pressable>
            {sections.map((s) => {
              const active = sectionId === s.id;
              return (
                <Pressable
                  key={s.id}
                  testID={`bill-sec-${s.id}`}
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

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            testID="bill-submit"
            onPress={submit}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: accent },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.submitText}>
              {editing ? "Salva" : "Crea scadenza"}
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  chipText: { color: colors.onSurfaceSecondary, fontSize: 13 },
  error: { color: colors.error, fontSize: 13, textAlign: "center", marginTop: spacing.sm },
  submit: {
    marginTop: spacing.lg,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  submitText: { color: "#000", fontSize: 16, fontWeight: "800" },
});
