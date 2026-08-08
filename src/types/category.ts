import { ExpenseType } from './expense';

export interface Category {
  name: string;
  type: ExpenseType;
  icon?: string; // Optional: name of the lucide icon
}
