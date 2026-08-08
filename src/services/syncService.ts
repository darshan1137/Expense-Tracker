import { db } from '../db/indexedDB';
import { sheetsService } from './googleSheets';
import { Expense } from '../types/expense';

export class SyncService {
  async addExpense(expense: Expense) {
    await db.expenses.put(expense);
    await db.syncQueue.put({ id: expense.id, action: 'ADD', payload: expense });
    if (navigator.onLine) await this.processQueue();
  }

  async updateExpense(expense: Expense) {
    await db.expenses.put(expense);
    await db.syncQueue.put({ id: `update-${expense.id}`, action: 'UPDATE', payload: expense });
    if (navigator.onLine) await this.processQueue();
  }

  async deleteExpense(id: string) {
    await db.expenses.delete(id);
    await db.syncQueue.put({ id: `delete-${id}`, action: 'DELETE', payload: { id } });
    if (navigator.onLine) await this.processQueue();
  }

  async processQueue() {
    if (!navigator.onLine) return;
    
    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) return;

    const addItems    = queue.filter(item => item.action === 'ADD');
    const updateItems = queue.filter(item => item.action === 'UPDATE');
    const deleteItems = queue.filter(item => item.action === 'DELETE');

    // Process ADDs
    if (addItems.length > 0) {
      try {
        await sheetsService.batchAddExpenses(addItems.map(i => i.payload));
        await db.syncQueue.bulkDelete(addItems.map(i => i.id));
      } catch (e) { console.error('Failed to sync ADDs', e); }
    }

    // Process UPDATEs
    for (const item of updateItems) {
      try {
        await sheetsService.updateExpense(item.payload);
        await db.syncQueue.delete(item.id);
      } catch (e) { console.error('Failed to sync UPDATE', e); }
    }

    // Process DELETEs
    for (const item of deleteItems) {
      try {
        await sheetsService.deleteExpense(item.payload.id);
        await db.syncQueue.delete(item.id);
      } catch (e) { console.error('Failed to sync DELETE', e); }
    }
  }

  async fetchInitialData() {
    if (!navigator.onLine) return;
    try {
      const expenses = await sheetsService.getExpenses();
      await db.expenses.clear();
      await db.expenses.bulkPut(expenses);
    } catch (error) {
      const msg = (error as any)?.message || '';
      if (msg.includes('invalid authentication credentials') || msg.includes('401')) {
        throw error; // Let App.tsx handle logout
      }
      console.error('Failed to fetch initial data', error);
    }
  }
}

export const syncService = new SyncService();

window.addEventListener('online', () => { syncService.processQueue(); });

