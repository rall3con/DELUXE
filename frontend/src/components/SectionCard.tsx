import FeatherIcon from "@react-native-vector-icons/feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/src/theme";
import { Section } from "@/src/types";
import { formatCurrency } from "@/src/store";

const COLOR_MAP: Record<Section["color"], string> = {
  purple: colors.brandPrimary,
  pink: colors.brandSecondary,
  green: colors.brandTertiary,
};

export function SectionCard({
  section,
  onPress,
  compact,
}: {
  section: Section;
  onPress?: () => void;
  compact?: boolean;
}) {
  const accent = COLOR_MAP[section.color] ?? colors.brandPrimary;
  const progress = section.target && section.target > 0
    ? Math.min(1, Math.max(0, section.balance / section.target))
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && { opacity: 0.85 },
      ]}
      testID={`section-card-${section.id}`}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: accent + "22", borderColor: accent + "44" }]}>
          <FeatherIcon name={section.icon as any} color={accent} size={18} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {section.name}
        </Text>
      </View>
      <Text style={styles.balance}>{formatCurrency(section.balance)}</Text>
      {progress !== null && (
        <View style={styles.progressWrap}>
          <View
            style={[
              styles.progressBar,
              { width: `${progress * 100}%`, backgroundColor: accent },
            ]}
          />
          <Text style={styles.target}>Obiettivo: {formatCurrency(section.target!)}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardCompact: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  name: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  balance: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  progressWrap: {
    marginTop: spacing.xs,
    gap: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: radius.pill,
  },
  target: {
    color: colors.muted,
    fontSize: 11,
  },
});
