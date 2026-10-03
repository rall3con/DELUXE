import FeatherIcon from "@react-native-vector-icons/feather";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/src/theme";
import { CURRENCIES, CurrencyCode, useCurrency } from "@/src/currency";

export type CurrencyPickerRef = {
  open: () => void;
  close: () => void;
};

export const CurrencyPicker = forwardRef<CurrencyPickerRef, {}>(
  function CurrencyPicker(_, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { currency, setCurrency, refresh, loading, rates } = useCurrency();

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.present(),
      close: () => sheetRef.current?.dismiss(),
    }));

    const snapPoints = useMemo(() => ["75%"], []);

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

    const pick = async (code: CurrencyCode) => {
      await setCurrency(code);
      sheetRef.current?.dismiss();
    };

    const lastUpdated = rates
      ? new Date(rates.fetchedAt).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surfaceSecondary }}
        handleIndicatorStyle={{ backgroundColor: colors.muted }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Scegli Valuta</Text>
            <Text style={styles.sub}>Tassi aggiornati · {lastUpdated}</Text>
          </View>
          <Pressable
            testID="currency-refresh"
            onPress={() => refresh()}
            style={styles.refreshBtn}
            disabled={loading}
          >
            <FeatherIcon
              name="refresh-cw"
              size={16}
              color={loading ? colors.muted : colors.brandPrimary}
            />
          </Pressable>
        </View>

        <BottomSheetFlatList
          data={CURRENCIES}
          keyExtractor={(i) => i.code}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const active = item.code === currency;
            const rate = rates?.rates[item.code];
            return (
              <Pressable
                testID={`currency-${item.code}`}
                onPress={() => pick(item.code)}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.info}>
                  <Text style={styles.rowCode}>
                    {item.code}{" "}
                    <Text style={styles.rowSymbol}>· {item.symbol}</Text>
                  </Text>
                  <Text style={styles.rowName}>{item.name}</Text>
                </View>
                <View style={styles.right}>
                  {item.code !== "EUR" && rate ? (
                    <Text style={styles.rate}>
                      1€ ≈ {rate.toFixed(item.decimals === 0 ? 1 : 2)}{" "}
                      {item.symbol}
                    </Text>
                  ) : item.code === "EUR" ? (
                    <Text style={styles.rate}>Valuta base</Text>
                  ) : null}
                  {active && (
                    <FeatherIcon
                      name="check-circle"
                      size={18}
                      color={colors.brandPrimary}
                    />
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  sub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowActive: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimary + "11",
  },
  flag: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  rowCode: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "700",
  },
  rowSymbol: {
    color: colors.muted,
    fontWeight: "500",
  },
  rowName: {
    color: colors.muted,
    fontSize: 12,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  rate: {
    color: colors.onSurfaceSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
});
