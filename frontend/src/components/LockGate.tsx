import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  getLocked,
  hasPin,
  initLock,
  startAppStateWatcher,
  subscribeLock,
  unlockApp,
} from "@/src/security";
import { LockScreen } from "./LockScreen";

/**
 * Wraps children with the lock gate. Shows LockScreen when locked.
 */
export function LockGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState<boolean>(getLocked());

  useEffect(() => {
    let unsubWatcher: (() => void) | null = null;
    (async () => {
      const has = await hasPin();
      if (!has) {
        await unlockApp();
      } else {
        await initLock();
      }
      setLocked(getLocked());
      setReady(true);
      unsubWatcher = startAppStateWatcher();
    })();
    const unsubLock = subscribeLock(setLocked);
    return () => {
      unsubLock();
      unsubWatcher?.();
    };
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: "#050505" }} />;
  }
  if (locked) {
    return <LockScreen />;
  }
  return <>{children}</>;
}
