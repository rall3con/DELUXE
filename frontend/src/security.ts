import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useEffect, useState } from "react";

const PIN_KEY = "gestore_conto_pin_hash";
const BIO_KEY = "gestore_conto_biometric_enabled";
const SESSION_KEY = "gestore_conto_session_unlocked";

// 60s background grace before lock
const BACKGROUND_LOCK_MS = 60 * 1000;

type LockListener = (locked: boolean) => void;

const listeners = new Set<LockListener>();
let locked = false;
let hasPinCache: boolean | null = null;
let backgroundAt: number | null = null;

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `gestore-conto:${pin}`,
  );
}

async function secureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, val: string) {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, val);
    } else {
      await SecureStore.setItemAsync(key, val);
    }
  } catch {}
}

async function secureDelete(key: string) {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {}
}

export async function hasPin(): Promise<boolean> {
  if (hasPinCache !== null) return hasPinCache;
  const v = await secureGet(PIN_KEY);
  hasPinCache = !!v;
  return hasPinCache;
}

export async function setPin(pin: string): Promise<void> {
  const h = await hashPin(pin);
  await secureSet(PIN_KEY, h);
  hasPinCache = true;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await secureGet(PIN_KEY);
  if (!stored) return false;
  const h = await hashPin(pin);
  return h === stored;
}

export async function removePin(): Promise<void> {
  await secureDelete(PIN_KEY);
  await setBiometricEnabled(false);
  hasPinCache = false;
}

export async function isBiometricEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(BIO_KEY);
  return v === "1";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIO_KEY, enabled ? "1" : "0");
}

export async function isBiometricSupported(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const compat = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compat && enrolled;
  } catch {
    return false;
  }
}

export async function promptBiometric(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sblocca Gestore Conto",
      cancelLabel: "Usa PIN",
      disableDeviceFallback: true,
    });
    return !!res.success;
  } catch {
    return false;
  }
}

// --- Lock state ---

function setLocked(v: boolean) {
  if (locked === v) return;
  locked = v;
  listeners.forEach((l) => l(v));
}

export function getLocked(): boolean {
  return locked;
}

export function subscribeLock(fn: LockListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function lockApp() {
  await AsyncStorage.removeItem(SESSION_KEY);
  setLocked(true);
}

export async function unlockApp() {
  await AsyncStorage.setItem(SESSION_KEY, "1");
  setLocked(false);
}

/**
 * Initializes the lock state on app start:
 * - If no PIN is set, app is unlocked
 * - Otherwise, app starts locked (cold start requires auth)
 */
export async function initLock(): Promise<void> {
  const pin = await hasPin();
  if (!pin) {
    setLocked(false);
    return;
  }
  // Cold start: always locked when a PIN exists
  await lockApp();
}

/** Register AppState listener for background→foreground lock after 60s. */
export function startAppStateWatcher(): () => void {
  const onChange = (next: AppStateStatus) => {
    if (next === "background" || next === "inactive") {
      backgroundAt = Date.now();
    } else if (next === "active") {
      if (backgroundAt && Date.now() - backgroundAt > BACKGROUND_LOCK_MS) {
        hasPin().then((has) => {
          if (has) setLocked(true);
        });
      }
      backgroundAt = null;
    }
  };
  const sub = AppState.addEventListener("change", onChange);
  return () => sub.remove();
}

export function useLockState() {
  const [state, setState] = useState(locked);
  useEffect(() => subscribeLock(setState), []);
  return state;
}
