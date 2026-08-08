import Dexie, { Table } from 'dexie';
import { Expense } from '../types/expense';

export class ExpenseTrackerDB extends Dexie {
  expenses!: Table<Expense, string>;
  syncQueue!: Table<{ id: string; action: 'ADD' | 'UPDATE' | 'DELETE'; payload: any }, string>;

  constructor() {
    super('ExpenseTrackerDB');
    this.version(1).stores({
      expenses: 'id, date, category, type', // Primary key and indexed props
      syncQueue: 'id, action'
    });
  }
}

export const db = new ExpenseTrackerDB();
