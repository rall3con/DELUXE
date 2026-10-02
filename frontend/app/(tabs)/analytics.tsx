import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import FeatherIcon from "@react-native-vector-icons/feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

import { formatCurrency, monthlyStats, useAppState } from "@/src/store";
import { colors, radius, spacing } from "@/src/theme";
import { EXPENSE_CATEGORIES, categoryLabel } from "@/src/types";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const state = useAppState();

  const data = useMemo(() => {
    if (!state) return null;
    const stats = monthlyStats(state);
    const now = new Date();
    // Expenses by category (this month)
    const byCat: Record<string, number> = {};
    for (const t of state.transactions) {
      const d = new Date(t.createdAt);
      if (
        t.type === "expense" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
      }
    }
    const totalExp = Object.values(byCat).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(byCat)
      .map(([cat, amt]) => ({ cat, amt, pct: totalExp ? amt / totalExp : 0 }))
      .sort((a, b) => b.amt - a.amt);
    const net = stats.income - stats.expense;
    return { stats, breakdown, totalExp, net };
  }, [state]);

  if (!state || !data) return <View style={styles.container} />;

  const palette = [
    colors.brandSecondary,
    colors.brandPrimary,
    colors.brandTertiary,
    colors.warning,
    colors.info,
    "#FF6AB1",
    "#8E6CFF",
    "#5EE6B8",
  ];

  const totalForDonut = data.stats.income + data.stats.expense;
  const incomePct = totalForDonut ? data.stats.income / totalForDonut : 0;
  const expensePct = totalForDonut ? data.stats.expense / totalForDonut : 0;

  return (
    <View style={styles.container} testID="analytics-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Analisi</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString("it-IT", {
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Net balance card */}
        <View style={styles.netCard}>
          <Text style={styles.netLabel}>Saldo del mese</Text>
          <Text
            style={[
              styles.netValue,
              { color: data.net >= 0 ? colors.brandTertiary : colors.brandSecondary },
            ]}
            testID="analytics-net"
          >
            {data.net >= 0 ? "+" : "-"}
            {formatCurrency(data.net).replace("-", "")}
          </Text>

          {/* Donut */}
          <View style={styles.donutWrap}>
            <Donut
              size={160}
              strokeWidth={16}
              incomePct={incomePct}
              expensePct={expensePct}
            />
            <View style={styles.donutCenter}>
              <Text style={styles.donutLabel}>Flusso</Text>
            </View>
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.brandTertiary }]} />
              <Text style={styles.legendLabel}>Entrate</Text>
              <Text style={[styles.legendValue, { color: colors.brandTertiary }]}>
                {formatCurrency(data.stats.income).replace("-", "")}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.brandSecondary }]} />
              <Text style={styles.legendLabel}>Uscite</Text>
              <Text style={[styles.legendValue, { color: colors.brandSecondary }]}>
                {formatCurrency(data.stats.expense).replace("-", "")}
              </Text>
            </View>
          </View>
        </View>

        {/* Breakdown */}
        <Text style={styles.sectionTitle}>Spese per categoria</Text>
        {data.breakdown.length === 0 ? (
          <View style={styles.empty}>
            <FeatherIcon name="bar-chart-2" size={28} color={colors.muted} />
            <Text style={styles.emptyText}>Nessuna uscita questo mese</Text>
          </View>
        ) : (
          <View style={styles.breakdown}>
            {data.breakdown.map((b, i) => {
              const color = palette[i % palette.length];
              return (
                <View key={b.cat} style={styles.catRow} testID={`cat-${b.cat}`}>
                  <View style={styles.catHeader}>
                    <View style={styles.catTitleRow}>
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      <Text style={styles.catName}>{categoryLabel(b.cat)}</Text>
                    </View>
                    <Text style={styles.catAmount}>
                      {formatCurrency(b.amt).replace("-", "")}
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${b.pct * 100}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <Text style={styles.pct}>
                    {Math.round(b.pct * 100)}% del totale
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Donut({
  size,
  strokeWidth,
  incomePct,
}: {
  size: number;
  strokeWidth: number;
  incomePct: number;
  expensePct: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const incomeLength = circumference * incomePct;
  const expenseLength = circumference * expensePct;

  const cx = size / 2;
  const cy = size / 2;
  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${cx} ${cy})`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceTertiary}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {incomePct > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.brandTertiary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${incomeLength} ${circumference}`}
            strokeLinecap="round"
          />
        )}
        {expensePct > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.brandSecondary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${expenseLength} ${circumference}`}
            strokeDashoffset={-incomeLength}
            strokeLinecap="round"
          />
        )}
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    textTransform: "capitalize",
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  netCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  netLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  netValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  donutWrap: {
    marginTop: spacing.sm,
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  donutLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  legend: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 17,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
  breakdown: {
    gap: spacing.md,
  },
  catRow: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catName: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  catAmount: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "700",
  },
  barBg: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: radius.pill,
  },
  pct: {
    color: colors.muted,
    fontSize: 11,
  },
});
