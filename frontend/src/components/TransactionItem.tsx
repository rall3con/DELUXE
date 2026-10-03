import FeatherIcon from "@react-native-vector-icons/feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/src/theme";
import { Transaction, resolveCategory } from "@/src/types";
import { useAppState } from "@/src/store";
import { useCurrency } from "@/src/currency";

export function TransactionItem({
  tx,
  sectionName,
  destName,
  onLongPress,
}: {
  tx: Transaction;
  sectionName: string;
  destName?: string;
  onLongPress?: () => void;
}) {
  const { format } = useCurrency();
  const state = useAppState();
  const isIncome = tx.type === "income";
  const isExpense = tx.type === "expense";
  const isTransfer = tx.type === "transfer";

  const accent = isIncome
    ? colors.brandTertiary
    : isExpense
    ? colors.brandSecondary
    : colors.brandPrimary;

  const resolved = resolveCategory(tx.category, state?.categories);
  const iconName = isTransfer ? "repeat" : (resolved.icon as any);
  const title = isTransfer ? `Trasferimento` : resolved.name;
  const subtitle = isTransfer
    ? `${sectionName} → ${destName ?? "?"}`
    : sectionName;

  const sign = isIncome ? "+" : isExpense ? "-" : "";
  const date = new Date(tx.createdAt);
  const dateStr = date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
  });

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      testID={`transaction-${tx.id}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + "22", borderColor: accent + "44" }]}>
        <FeatherIcon name={iconName} color={accent} size={18} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle} · {dateStr}
        </Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: isIncome ? colors.brandTertiary : isExpense ? colors.brandSecondary : colors.onSurface },
        ]}
      >
        {sign}
        {format(tx.amount).replace("-", "")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
