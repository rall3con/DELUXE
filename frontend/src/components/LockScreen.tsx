import FeatherIcon from "@react-native-vector-icons/feather";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { colors, radius, spacing } from "@/src/theme";
import {
  isBiometricEnabled,
  isBiometricSupported,
  promptBiometric,
  unlockApp,
  verifyPin,
} from "@/src/security";

const PIN_LENGTH = 4;

type Props = {
  /** when set, acts as "verify current PIN" and calls onVerified instead of unlocking app */
  verifyMode?: boolean;
  onVerified?: () => void;
  onCancel?: () => void;
  title?: string;
};

export function LockScreen({ verifyMode, onVerified, onCancel, title }: Props) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const triedBioRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [s, e] = await Promise.all([
        isBiometricSupported(),
        isBiometricEnabled(),
      ]);
      setBioSupported(s);
      setBioEnabled(e);
      if (!verifyMode && s && e && !triedBioRef.current) {
        triedBioRef.current = true;
        const ok = await promptBiometric();
        if (ok) await unlockApp();
      }
    })();
  }, [verifyMode]);

  const press = async (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    Haptics.selectionAsync().catch(() => {});
    const next = pin + digit;
    setPin(next);
    setError(null);
    if (next.length === PIN_LENGTH) {
      const ok = await verifyPin(next);
      if (ok) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
        if (verifyMode) {
          onVerified?.();
        } else {
          await unlockApp();
        }
      } else {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        ).catch(() => {});
        setError("PIN errato");
        setTimeout(() => setPin(""), 400);
      }
    }
  };

  const backspace = () => {
    Haptics.selectionAsync().catch(() => {});
    setPin((p) => p.slice(0, -1));
    setError(null);
  };

  const useBio = async () => {
    const ok = await promptBiometric();
    if (ok) {
      if (verifyMode) {
        onVerified?.();
      } else {
        await unlockApp();
      }
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg },
      ]}
      testID="lock-screen"
    >
      <View style={styles.brand}>
        <View style={styles.logo}>
          <FeatherIcon name="lock" size={28} color={colors.brandPrimary} />
        </View>
        <Text style={styles.title}>
          {title ?? (verifyMode ? "Inserisci il PIN" : "Gestore Conto")}
        </Text>
        <Text style={styles.subtitle}>
          {verifyMode ? "Conferma la tua identità" : "Inserisci il PIN per sbloccare"}
        </Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </View>

      {error && <Text style={styles.error} testID="pin-error">{error}</Text>}

      <View style={styles.pad}>
        <View style={styles.padRow}>
          {keys.slice(0, 3).map((k) => (
            <KeyBtn key={k} label={k} onPress={() => press(k)} />
          ))}
        </View>
        <View style={styles.padRow}>
          {keys.slice(3, 6).map((k) => (
            <KeyBtn key={k} label={k} onPress={() => press(k)} />
          ))}
        </View>
        <View style={styles.padRow}>
          {keys.slice(6, 9).map((k) => (
            <KeyBtn key={k} label={k} onPress={() => press(k)} />
          ))}
        </View>
        <View style={styles.padRow}>
          <View style={styles.sideBtn}>
            {bioSupported && bioEnabled && (
              <Pressable
                testID="lock-bio"
                onPress={useBio}
                style={styles.sideIconBtn}
              >
                <FeatherIcon
                  name="smile"
                  size={24}
                  color={colors.brandPrimary}
                />
              </Pressable>
            )}
          </View>
          <KeyBtn label="0" onPress={() => press("0")} />
          <View style={styles.sideBtn}>
            <Pressable
              testID="lock-backspace"
              onPress={backspace}
              style={styles.sideIconBtn}
            >
              <FeatherIcon
                name="delete"
                size={24}
                color={colors.onSurface}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {verifyMode && onCancel && (
        <Pressable
          testID="lock-cancel"
          onPress={onCancel}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Annulla</Text>
        </Pressable>
      )}
    </View>
  );
}

function KeyBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      testID={`pin-${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.keyBtn, pressed && styles.keyBtnPressed]}
    >
      <Text style={styles.keyLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandPrimary + "22",
    borderWidth: 1,
    borderColor: colors.brandPrimary + "44",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  dots: {
    flexDirection: "row",
    gap: 20,
    marginTop: spacing.lg,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  dotFilled: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  dotError: {
    borderColor: colors.brandSecondary,
  },
  error: {
    color: colors.brandSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  pad: {
    gap: spacing.md,
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
  },
  padRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  keyBtn: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 80,
    borderRadius: 999,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keyBtnPressed: {
    backgroundColor: colors.brandPrimary + "22",
    borderColor: colors.brandPrimary,
  },
  keyLabel: {
    color: colors.onSurface,
    fontSize: 26,
    fontWeight: "600",
  },
  sideBtn: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  sideIconBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    marginTop: spacing.md,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
});
