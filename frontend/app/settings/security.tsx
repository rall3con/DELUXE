import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import FeatherIcon from "@react-native-vector-icons/feather";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/src/theme";
import {
  hasPin,
  isBiometricEnabled,
  isBiometricSupported,
  lockApp,
  removePin,
  setBiometricEnabled,
  setPin,
  verifyPin,
} from "@/src/security";
import { resetAllData } from "@/src/store";
import { LockScreen } from "@/src/components/LockScreen";

type Flow = "idle" | "setPin1" | "setPin2" | "verify-remove" | "verify-change" | "setNew1" | "setNew2";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const PIN_LEN = 4;

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pinSet, setPinSet] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [flow, setFlow] = useState<Flow>("idle");
  const [buf, setBuf] = useState("");
  const [first, setFirst] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmReset2, setConfirmReset2] = useState(false);

  const refresh = async () => {
    setPinSet(await hasPin());
    setBioSupported(await isBiometricSupported());
    setBioOn(await isBiometricEnabled());
  };

  useEffect(() => {
    refresh();
  }, []);

  const cancel = () => {
    setFlow("idle");
    setBuf("");
    setFirst("");
    setError(null);
  };

  const press = async (d: string) => {
    if (buf.length >= PIN_LEN) return;
    const next = buf + d;
    setBuf(next);
    setError(null);
    if (next.length === PIN_LEN) {
      // dispatch per-flow
      if (flow === "setPin1") {
        setFirst(next);
        setBuf("");
        setFlow("setPin2");
      } else if (flow === "setPin2") {
        if (next !== first) {
          setError("I PIN non corrispondono");
          setTimeout(() => setBuf(""), 300);
          return;
        }
        await setPin(next);
        await refresh();
        cancel();
      } else if (flow === "verify-remove") {
        const ok = await verifyPin(next);
        if (!ok) {
          setError("PIN errato");
          setTimeout(() => setBuf(""), 300);
          return;
        }
        await removePin();
        await refresh();
        cancel();
      } else if (flow === "verify-change") {
        const ok = await verifyPin(next);
        if (!ok) {
          setError("PIN errato");
          setTimeout(() => setBuf(""), 300);
          return;
        }
        setBuf("");
        setFlow("setNew1");
      } else if (flow === "setNew1") {
        setFirst(next);
        setBuf("");
        setFlow("setNew2");
      } else if (flow === "setNew2") {
        if (next !== first) {
          setError("I PIN non corrispondono");
          setTimeout(() => setBuf(""), 300);
          return;
        }
        await setPin(next);
        await refresh();
        cancel();
      }
    }
  };

  const back = () => {
    setBuf((b) => b.slice(0, -1));
    setError(null);
  };

  const toggleBio = async (v: boolean) => {
    await setBiometricEnabled(v);
    setBioOn(v);
  };

  const doReset = async () => {
    await resetAllData();
    await removePin();
    await lockApp();
    router.replace("/");
  };

  // Render flow overlays
  if (flow !== "idle") {
    const titles: Record<Flow, string> = {
      idle: "",
      setPin1: "Scegli un nuovo PIN",
      setPin2: "Conferma il PIN",
      "verify-remove": "Conferma per disattivare",
      "verify-change": "PIN attuale",
      setNew1: "Nuovo PIN",
      setNew2: "Conferma nuovo PIN",
    };
    return (
      <PinFlow
        title={titles[flow]}
        buf={buf}
        error={error}
        onDigit={press}
        onBack={back}
        onCancel={cancel}
      />
    );
  }

  return (
    <View style={styles.container} testID="security-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable
          testID="sec-back"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <FeatherIcon name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Sicurezza</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <FeatherIcon name="lock" size={18} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>PIN di accesso</Text>
              <Text style={styles.rowSub}>
                {pinSet ? "4 cifre impostato" : "Non impostato"}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            {pinSet ? (
              <>
                <Pressable
                  testID="change-pin"
                  onPress={() => setFlow("verify-change")}
                  style={[styles.btn, styles.btnSecondary]}
                >
                  <Text style={styles.btnText}>Cambia PIN</Text>
                </Pressable>
                <Pressable
                  testID="remove-pin"
                  onPress={() => setFlow("verify-remove")}
                  style={[styles.btn, { backgroundColor: colors.brandSecondary }]}
                >
                  <Text style={[styles.btnText, { color: colors.onSurface }]}>Disattiva</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                testID="set-pin"
                onPress={() => setFlow("setPin1")}
                style={[styles.btn, { backgroundColor: colors.brandPrimary }]}
              >
                <Text style={styles.btnText}>Imposta PIN</Text>
              </Pressable>
            )}
          </View>
        </View>

        {pinSet && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <FeatherIcon name="smile" size={18} color={colors.brandTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Sblocco biometrico</Text>
                <Text style={styles.rowSub}>
                  {bioSupported
                    ? "Face ID / impronta come scorciatoia. Il PIN resta sempre valido."
                    : "Non disponibile su questo dispositivo"}
                </Text>
              </View>
              <Switch
                testID="toggle-biometric"
                disabled={!bioSupported}
                value={bioOn && bioSupported}
                onValueChange={toggleBio}
                trackColor={{ false: colors.border, true: colors.brandTertiary }}
                thumbColor={colors.onSurface}
              />
            </View>
          </View>
        )}

        <View style={[styles.card, { borderColor: colors.brandSecondary + "33" }]}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.brandSecondary + "22", borderColor: colors.brandSecondary + "44" },
              ]}
            >
              <FeatherIcon name="alert-triangle" size={18} color={colors.brandSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Reset app</Text>
              <Text style={styles.rowSub}>
                Elimina tutti i dati locali (sezioni, movimenti, ricorrenti, scadenze, PIN).
                Non è reversibile.
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable
              testID="reset-app"
              onPress={() => setConfirmReset(true)}
              style={[styles.btn, { backgroundColor: colors.brandSecondary }]}
            >
              <Text style={[styles.btnText, { color: colors.onSurface }]}>
                Resetta tutto
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {confirmReset && (
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Sei sicuro?</Text>
            <Text style={styles.confirmText}>
              Tutti i tuoi dati verranno persi. Questa operazione non può essere
              annullata.
            </Text>
            <View style={styles.row}>
              <Pressable
                testID="reset-cancel"
                onPress={() => setConfirmReset(false)}
                style={[styles.btn, { backgroundColor: colors.surfaceTertiary, flex: 1 }]}
              >
                <Text style={styles.btnText}>Annulla</Text>
              </Pressable>
              <Pressable
                testID="reset-step2"
                onPress={() => {
                  setConfirmReset(false);
                  setConfirmReset2(true);
                }}
                style={[styles.btn, { backgroundColor: colors.brandSecondary, flex: 1 }]}
              >
                <Text style={[styles.btnText, { color: colors.onSurface }]}>Continua</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {confirmReset2 && (
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Ultima conferma</Text>
            <Text style={styles.confirmText}>
              Conferma di voler eliminare DEFINITIVAMENTE tutti i dati.
            </Text>
            <View style={styles.row}>
              <Pressable
                testID="reset-cancel2"
                onPress={() => setConfirmReset2(false)}
                style={[styles.btn, { backgroundColor: colors.surfaceTertiary, flex: 1 }]}
              >
                <Text style={styles.btnText}>No, annulla</Text>
              </Pressable>
              <Pressable
                testID="reset-confirm"
                onPress={doReset}
                style={[styles.btn, { backgroundColor: colors.brandSecondary, flex: 1 }]}
              >
                <Text style={[styles.btnText, { color: colors.onSurface }]}>
                  Sì, elimina tutto
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function PinFlow({
  title,
  buf,
  error,
  onDigit,
  onBack,
  onCancel,
}: {
  title: string;
  buf: string;
  error: string | null;
  onDigit: (d: string) => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.flow,
        { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg },
      ]}
      testID="pin-flow"
    >
      <Text style={styles.flowTitle}>{title}</Text>
      <View style={styles.dots}>
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < buf.length && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.pad}>
        {[0, 1, 2].map((r) => (
          <View key={r} style={styles.padRow}>
            {DIGITS.slice(r * 3, r * 3 + 3).map((d) => (
              <Pressable
                key={d}
                testID={`pin-setup-${d}`}
                onPress={() => onDigit(d)}
                style={({ pressed }) => [styles.keyBtn, pressed && styles.keyBtnPressed]}
              >
                <Text style={styles.keyLabel}>{d}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <View style={styles.padRow}>
          <View style={{ flex: 1, aspectRatio: 1, maxWidth: 80 }} />
          <Pressable
            testID="pin-setup-0"
            onPress={() => onDigit("0")}
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyBtnPressed]}
          >
            <Text style={styles.keyLabel}>0</Text>
          </Pressable>
          <View style={{ flex: 1, aspectRatio: 1, maxWidth: 80, alignItems: "center", justifyContent: "center" }}>
            <Pressable testID="pin-setup-back" onPress={onBack} style={styles.sideIconBtn}>
              <FeatherIcon name="delete" size={22} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>
      </View>
      <Pressable testID="pin-setup-cancel" onPress={onCancel} style={{ marginTop: spacing.md }}>
        <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>Annulla</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary + "22",
    borderWidth: 1,
    borderColor: colors.brandPrimary + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondary: {
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "700",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  confirmBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  confirmTitle: { color: colors.onSurface, fontSize: 17, fontWeight: "700" },
  confirmText: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 18 },
  row: { flexDirection: "row", gap: spacing.sm },

  // PinFlow
  flow: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "space-between",
  },
  flowTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.lg,
  },
  dots: {
    flexDirection: "row",
    gap: 20,
    marginTop: spacing.xl,
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
  dotError: { borderColor: colors.brandSecondary },
  error: {
    color: colors.brandSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  pad: {
    gap: spacing.md,
    width: "100%",
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
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
  sideIconBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
