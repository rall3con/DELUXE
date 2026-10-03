import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FeatherIcon from "@react-native-vector-icons/feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

import { useAppState } from "@/src/store";
import { useCurrency } from "@/src/currency";
import {
  CurrencyPicker,
  CurrencyPickerRef,
} from "@/src/components/CurrencyPicker";
import { colors, radius, spacing } from "@/src/theme";
import { resolveCategory } from "@/src/types";

const MONTHS_IT = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const state = useAppState();
  const { format, info } = useCurrency();
  const currencyRef = useRef<CurrencyPickerRef>(null);

  // Month offset: 0 = current month, -1 = previous, etc.
  const [monthOffset, setMonthOffset] = useState(0);

  const monthDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const data = useMemo(() => {
    if (!state) return null;
    const target = monthDate;
    let income = 0;
    let expense = 0;
    const byCat: Record<string, number> = {};
    for (const t of state.transactions) {
      const d = new Date(t.createdAt);
      if (
        d.getMonth() === target.getMonth() &&
        d.getFullYear() === target.getFullYear()
      ) {
        if (t.type === "income") income += t.amount;
        else if (t.type === "expense") {
          expense += t.amount;
          byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
        }
      }
    }
    const totalExp = Object.values(byCat).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(byCat)
      .map(([cat, amt]) => ({ cat, amt, pct: totalExp ? amt / totalExp : 0 }))
      .sort((a, b) => b.amt - a.amt);
    return { income, expense, breakdown, totalExp, net: income - expense };
  }, [state, monthDate]);

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

  const totalForDonut = data.income + data.expense;
  const incomePct = totalForDonut ? data.income / totalForDonut : 0;
  const expensePct = totalForDonut ? data.expense / totalForDonut : 0;

  const monthLabel = `${MONTHS_IT[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

  return (
    <View style={styles.container} testID="analytics-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Analisi</Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>
        <Pressable
          testID="analytics-currency"
          onPress={() => currencyRef.current?.open()}
          style={styles.currencyChip}
        >
          <Text style={styles.flag}>{info.flag}</Text>
          <Text style={styles.code}>{info.code}</Text>
          <FeatherIcon name="chevron-down" size={14} color={colors.onSurface} />
        </Pressable>
      </View>

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <Pressable
          testID="prev-month"
          onPress={() => setMonthOffset((o) => o - 1)}
          style={styles.navBtn}
        >
          <FeatherIcon name="chevron-left" size={18} color={colors.onSurface} />
        </Pressable>
        <View style={styles.monthLabelWrap}>
          <FeatherIcon name="calendar" size={14} color={colors.muted} />
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>
        <Pressable
          testID="next-month"
          onPress={() => setMonthOffset((o) => Math.min(0, o + 1))}
          style={[styles.navBtn, monthOffset >= 0 && { opacity: 0.3 }]}
          disabled={monthOffset >= 0}
        >
          <FeatherIcon
            name="chevron-right"
            size={18}
            color={colors.onSurface}
          />
        </Pressable>
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
              {
                color:
                  data.net >= 0 ? colors.brandTertiary : colors.brandSecondary,
              },
            ]}
            testID="analytics-net"
          >
            {data.net >= 0 ? "+" : "-"}
            {format(data.net).replace("-", "")}
          </Text>

          {/* Donut */}
          <View style={styles.donutWrap}>
            <Donut
              size={180}
              strokeWidth={18}
              incomePct={incomePct}
              expensePct={expensePct}
            />
            <View style={styles.donutCenter}>
              {totalForDonut > 0 ? (
                <>
                  <Text style={styles.donutPercent}>
                    {Math.round(incomePct * 100)}%
                  </Text>
                  <Text style={styles.donutHint}>entrate</Text>
                </>
              ) : (
                <Text style={styles.donutEmpty}>Nessun dato</Text>
              )}
            </View>
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.brandTertiary }]} />
              <Text style={styles.legendLabel}>Entrate</Text>
              <Text
                style={[styles.legendValue, { color: colors.brandTertiary }]}
              >
                {format(data.income).replace("-", "")}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.brandSecondary }]} />
              <Text style={styles.legendLabel}>Uscite</Text>
              <Text
                style={[styles.legendValue, { color: colors.brandSecondary }]}
              >
                {format(data.expense).replace("-", "")}
              </Text>
            </View>
          </View>
        </View>

        {/* Breakdown */}
        <Text style={styles.sectionTitle}>Spese per categoria</Text>
        {data.breakdown.length === 0 ? (
          <View style={styles.empty} testID="analytics-empty">
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
                      <Text style={styles.catName}>{resolveCategory(b.cat, state?.categories).name}</Text>
                    </View>
                    <Text style={styles.catAmount}>
                      {format(b.amt).replace("-", "")}
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${b.pct * 100}%`,
                          backgroundColor: color,
                        },
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

      <CurrencyPicker ref={currencyRef} />
    </View>
  );
}

function Donut({
  size,
  strokeWidth,
  incomePct,
  expensePct,
}: {
  size: number;
  strokeWidth: number;
  incomePct: number;
  expensePct: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const incomeLength = circumference * incomePct;
  const expenseLength = circumference * expensePct;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${cx} ${cy})`}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.surfaceTertiary}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {incomePct > 0 && (
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.brandTertiary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${incomeLength} ${circumference}`}
            strokeLinecap="round"
          />
        )}
        {expensePct > 0 && (
          <Circle
            cx={cx}
            cy={cy}
            r={r}
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
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
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
  currencyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flag: {
    fontSize: 14,
  },
  code: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  monthLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthLabel: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
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
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  donutPercent: {
    color: colors.onSurface,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  donutHint: {
    color: colors.muted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
    marginTop: 2,
  },
  donutEmpty: {
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
