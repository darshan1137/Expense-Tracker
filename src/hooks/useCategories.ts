// Thin re-export — all logic lives in CategoriesContext.tsx.
// Components import from here; the context owns the singleton listener.
export { useCategories } from '../context/CategoriesContext';
export type { CustomCategory, ResolvedCategory } from '../context/CategoriesContext';
