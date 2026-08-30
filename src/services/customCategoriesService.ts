import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { DEFAULT_CATEGORIES } from '../utils/categories';

// ── Firestore with persistent offline cache ─────────────────────────
// initializeFirestore replaces getFirestore and MUST be called before
// any other Firestore operation. It is idempotent-safe because we guard
// with getApps()[0].
const app = getApps()[0];
export const firestoreDb = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// ── Types ───────────────────────────────────────────────────────────
export interface CustomCategory {
  name: string;
  type: 'Needs' | 'Wants' | 'Investments';
}

export interface ResolvedCategory {
  name: string;
  type: 'Needs' | 'Wants' | 'Investments';
  source: 'default' | 'custom';
}

export interface CategoryDoc {
  customList: CustomCategory[];
  hiddenDefaults: string[];
}

// ── localStorage mirror (instant sync-free initial render) ──────────
// Only used as the initial value before the first onSnapshot fires.
const LS_CUSTOM = 'cat_custom';
const LS_HIDDEN = 'cat_hidden';

export function readCache(): CategoryDoc {
  try {
    return {
      customList: JSON.parse(localStorage.getItem(LS_CUSTOM) ?? '[]'),
      hiddenDefaults: JSON.parse(localStorage.getItem(LS_HIDDEN) ?? '[]'),
    };
  } catch {
    return { customList: [], hiddenDefaults: [] };
  }
}

function writeCache(doc: CategoryDoc) {
  localStorage.setItem(LS_CUSTOM, JSON.stringify(doc.customList));
  localStorage.setItem(LS_HIDDEN, JSON.stringify(doc.hiddenDefaults));
}

// ── Firestore path ───────────────────────────────────────────────────
export function catDocRef(uid: string) {
  return doc(firestoreDb, 'users', uid, 'settings', 'categories');
}

// ── Real-time subscription (one per app lifetime) ────────────────────
// Returns an unsubscribe function. The callback fires immediately with
// cached data (from IndexedDB), then again when the server responds.
export function subscribeToCategoryDoc(
  uid: string,
  onUpdate: (data: CategoryDoc) => void
): Unsubscribe {
  return onSnapshot(
    catDocRef(uid),
    { includeMetadataChanges: false }, // don't fire on local pending writes
    (snap) => {
      const data: CategoryDoc = snap.exists()
        ? {
            customList: snap.data().customList ?? [],
            hiddenDefaults: snap.data().hiddenDefaults ?? [],
          }
        : { customList: [], hiddenDefaults: [] };
      writeCache(data);     // keep localStorage mirror fresh
      onUpdate(data);
    },
    () => {
      // On error (e.g. permission denied), fall back to cache silently
      onUpdate(readCache());
    }
  );
}

// ── Debounced write ──────────────────────────────────────────────────
// Writes are debounced so rapid sequential mutations (e.g. bulk restore)
// collapse into a single Firestore write. Local state is updated
// immediately by the context; Firestore is synced after the pause.
let writeTimer: ReturnType<typeof setTimeout> | null = null;

export function schedulePersist(uid: string, data: CategoryDoc, delayMs = 600) {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(async () => {
    try {
      await setDoc(catDocRef(uid), data, { merge: true });
    } catch (e) {
      console.warn('[categories] Firestore write failed (offline?), will retry on next change.', e);
    }
  }, delayMs);
}

// ── Derived helper ───────────────────────────────────────────────────
export function resolveCategories(data: CategoryDoc): ResolvedCategory[] {
  return [
    ...DEFAULT_CATEGORIES
      .filter(c => !data.hiddenDefaults.includes(c.name))
      .map(c => ({ name: c.name, type: c.type, source: 'default' as const })),
    ...data.customList.map(c => ({ ...c, source: 'custom' as const })),
  ];
}
