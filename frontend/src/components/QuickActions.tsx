import FeatherIcon from "@react-native-vector-icons/feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/src/theme";

export type QuickActionProps = {
  onIncome: () => void;
  onExpense: () => void;
  onTransfer: () => void;
};

export function QuickActions({ onIncome, onExpense, onTransfer }: QuickActionProps) {
  return (
    <View style={styles.row}>
      <ActionButton
        testID="quick-action-income"
        label="Entrata"
        icon="arrow-down-left"
        color={colors.brandTertiary}
        onPress={onIncome}
      />
      <ActionButton
        testID="quick-action-expense"
        label="Uscita"
        icon="arrow-up-right"
        color={colors.brandSecondary}
        onPress={onExpense}
      />
      <ActionButton
        testID="quick-action-transfer"
        label="Trasferisci"
        icon="repeat"
        color={colors.brandPrimary}
        onPress={onTransfer}
      />
    </View>
  );
}

function ActionButton({
  label,
  icon,
  color,
  onPress,
  testID,
}: {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + "22", borderColor: color + "44" }]}>
        <FeatherIcon name={icon as any} color={color} size={22} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  btn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  label: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: "600",
  },
});
