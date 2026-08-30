import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  CategoryDoc,
  CustomCategory,
  ResolvedCategory,
  readCache,
  subscribeToCategoryDoc,
  schedulePersist,
  resolveCategories,
} from '../services/customCategoriesService';
import { DEFAULT_CATEGORIES } from '../utils/categories';

// ── Context shape ────────────────────────────────────────────────────
interface CategoriesCtx {
  allCategories: ResolvedCategory[];
  customList: CustomCategory[];
  hiddenDefaults: string[];
  allDefaults: typeof DEFAULT_CATEGORIES;
  loading: boolean;
  add: (cat: CustomCategory) => void;
  hideDefault: (name: string) => void;
  restoreDefault: (name: string) => void;
  restoreAll: () => void;
  removeCustom: (name: string) => void;
}

const CategoriesContext = createContext<CategoriesCtx | null>(null);

// ── Provider ─────────────────────────────────────────────────────────
export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  // Initialise from localStorage so first render is instant (no flicker)
  const [doc, setDoc] = useState<CategoryDoc>(readCache);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef<string | null>(null);

  // Subscribe to Firestore once per uid. Clean up when uid changes (logout).
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(getAuth(), (user) => {
      uidRef.current = user?.uid ?? null;

      if (!user) {
        setLoading(false);
        return;
      }

      const unsubSnap = subscribeToCategoryDoc(user.uid, (data) => {
        setDoc(data);
        setLoading(false);
      });

      // Return cleanup inside the auth callback scope
      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, []);

  // ── Optimistic mutations with debounced persist ──────────────────
  function mutate(next: CategoryDoc) {
    setDoc(next);
    if (uidRef.current) schedulePersist(uidRef.current, next);
  }

  const add = (cat: CustomCategory) => {
    if (doc.customList.some(c => c.name.toLowerCase() === cat.name.toLowerCase())) return;
    mutate({ ...doc, customList: [...doc.customList, cat] });
  };

  const hideDefault = (name: string) => {
    if (doc.hiddenDefaults.includes(name)) return;
    mutate({ ...doc, hiddenDefaults: [...doc.hiddenDefaults, name] });
  };

  const restoreDefault = (name: string) => {
    mutate({ ...doc, hiddenDefaults: doc.hiddenDefaults.filter(h => h !== name) });
  };

  const restoreAll = () => {
    mutate({ ...doc, hiddenDefaults: [] });
  };

  const removeCustom = (name: string) => {
    mutate({ ...doc, customList: doc.customList.filter(c => c.name !== name) });
  };

  const value: CategoriesCtx = {
    allCategories: resolveCategories(doc),
    customList: doc.customList,
    hiddenDefaults: doc.hiddenDefaults,
    allDefaults: DEFAULT_CATEGORIES,
    loading,
    add,
    hideDefault,
    restoreDefault,
    restoreAll,
    removeCustom,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────
export function useCategories(): CategoriesCtx {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used inside <CategoriesProvider>');
  return ctx;
}

export type { CustomCategory, ResolvedCategory };
