/**
 * Manages user-defined custom categories in localStorage.
 * Each custom category has a name and a type (Needs/Wants/Investments).
 */

export interface CustomCategory {
  name: string;
  type: 'Needs' | 'Wants' | 'Investments';
}

const STORAGE_KEY = 'user_custom_categories';

export function getCustomCategories(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCategory(cat: CustomCategory): CustomCategory[] {
  const current = getCustomCategories();
  // Prevent duplicates (case-insensitive)
  if (current.some(c => c.name.toLowerCase() === cat.name.toLowerCase())) {
    return current;
  }
  const updated = [...current, cat];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeCustomCategory(name: string): CustomCategory[] {
  const updated = getCustomCategories().filter(c => c.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
