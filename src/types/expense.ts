export type ExpenseType = 'Needs' | 'Wants' | 'Investments';

export interface Expense {
  id: string;
  date: string; // ISO string for easier JSON serialization, or Date object. Let's use string (YYYY-MM-DD).
  description: string;
  category: string;
  type: ExpenseType;
  amount: number;
  notes?: string;
}
