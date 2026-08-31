import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/** 
 * Compares two semver strings.
 * Returns  1 if a > b,  0 if equal, -1 if a < b
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff > 0) return 1;
    if (diff < 0) return -1;
  }
  return 0;
}

export interface UpdateInfo {
  version: string;
  apkUrl: string;
  releaseNotes: string;
  releaseDate: string;
}

/**
 * CURRENT_APP_VERSION — bump this every time you build a new APK.
 * When the deployed version.json has a higher version than this constant,
 * the update dialog will appear automatically inside the app.
 */
export const CURRENT_APP_VERSION = '1.1.7';

export function useAppUpdater() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        // Only show APK updates if running as a native mobile app
        if (!Capacitor.isNativePlatform()) return;

        // Bust the cache so we always get the latest version.json
        // NOTE: Use the absolute live URL so Capacitor native apps fetch from the web, 
        // rather than their bundled local assets.
        const res = await fetch(`https://expense-manager-cg.vercel.app/version.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data: UpdateInfo = await res.json();
        if (compareSemver(data.version, CURRENT_APP_VERSION) > 0) {
          setUpdateInfo(data);
        }
      } catch {
        // Silently ignore — don't break the app if the check fails
      }
    };

    check();
    // Re-check every 30 minutes while the app is open
    const interval = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = () => setDismissed(true);

  return { updateInfo: dismissed ? null : updateInfo, dismiss };
}
