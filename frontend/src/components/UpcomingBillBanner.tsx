import FeatherIcon from "@react-native-vector-icons/feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/src/theme";
import { Bill } from "@/src/types";
import { daysUntil, payBill } from "@/src/store";
import { useCurrency } from "@/src/currency";
import { useState } from "react";

type Severity = "ok" | "warning" | "urgent" | "overdue";

export function severityFor(bill: Bill, now = new Date()): Severity {
  const d = daysUntil(bill.dueDate, now);
  if (d < 0) return "overdue";
  if (d === 0) return "urgent";
  if (d <= 3) return "warning";
  return "ok";
}

const COLOR_MAP: Record<Severity, { fg: string; bg: string; bd: string }> = {
  ok: {
    fg: colors.brandTertiary,
    bg: colors.brandTertiary + "11",
    bd: colors.brandTertiary + "44",
  },
  warning: {
    fg: colors.warning,
    bg: colors.warning + "11",
    bd: colors.warning + "44",
  },
  urgent: {
    fg: colors.brandSecondary,
    bg: colors.brandSecondary + "11",
    bd: colors.brandSecondary + "66",
  },
  overdue: {
    fg: colors.brandSecondary,
    bg: colors.brandSecondary + "22",
    bd: colors.brandSecondary,
  },
};

function labelFor(bill: Bill, now = new Date()): string {
  const d = daysUntil(bill.dueDate, now);
  if (d < 0) return `Scaduta da ${-d}g`;
  if (d === 0) return "Scade oggi";
  if (d === 1) return "Scade domani";
  return `Scade fra ${d}g`;
}

export function UpcomingBillBanner({
  bills,
  onManage,
}: {
  bills: Bill[];
  onManage: () => void;
}) {
  const { format } = useCurrency();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (bills.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Scadenze in arrivo</Text>
        <Pressable testID="manage-bills" onPress={onManage}>
          <Text style={styles.link}>Gestisci</Text>
        </Pressable>
      </View>
      {bills.slice(0, 3).map((b) => {
        const sev = severityFor(b);
        const palette = COLOR_MAP[sev];
        return (
          <View
            key={b.id}
            style={[
              styles.card,
              { backgroundColor: palette.bg, borderColor: palette.bd },
            ]}
            testID={`bill-${b.id}`}
          >
            <View
              style={[styles.icon, { backgroundColor: palette.fg + "33" }]}
            >
              <FeatherIcon
                name={sev === "overdue" ? "alert-triangle" : "clock"}
                size={18}
                color={palette.fg}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={[styles.status, { color: palette.fg }]}>
                {labelFor(b)}
                {b.amount ? ` · ${format(b.amount)}` : ""}
              </Text>
            </View>
            {b.amount ? (
              <Pressable
                testID={`bill-pay-${b.id}`}
                disabled={busyId === b.id}
                onPress={async () => {
                  setBusyId(b.id);
                  await payBill(b.id, { createExpense: true });
                  setBusyId(null);
                }}
                style={[styles.payBtn, { backgroundColor: palette.fg }]}
              >
                <Text style={styles.payText}>Paga</Text>
              </Pressable>
            ) : (
              <Pressable
                testID={`bill-mark-${b.id}`}
                disabled={busyId === b.id}
                onPress={async () => {
                  setBusyId(b.id);
                  await payBill(b.id, { createExpense: false });
                  setBusyId(null);
                }}
                style={[
                  styles.payBtn,
                  { backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: palette.bd },
                ]}
              >
                <Text style={[styles.payText, { color: palette.fg }]}>Fatto</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  heading: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "700",
  },
  link: {
    color: colors.brandPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "700",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  payBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  payText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
});
