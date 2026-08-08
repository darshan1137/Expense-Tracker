import { db } from '../db/indexedDB';
import { sheetsService } from './googleSheets';
import { Expense } from '../types/expense';

export class SyncService {
  async addExpense(expense: Expense) {
    // 1. Save locally
    await db.expenses.put(expense);
    
    // 2. Queue for sync
    await db.syncQueue.put({
      id: expense.id,
      action: 'ADD',
      payload: expense
    });

    // 3. Attempt sync if online
    if (navigator.onLine) {
      await this.processQueue();
    }
  }

  async processQueue() {
    if (!navigator.onLine) return;
    
    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) return;

    const addItems = queue.filter(item => item.action === 'ADD');
    
    if (addItems.length > 0) {
      try {
        const expensesToAdd = addItems.map(item => item.payload);
        await sheetsService.batchAddExpenses(expensesToAdd);
        
        // Remove processed items from queue
        const itemIds = addItems.map(item => item.id);
        await db.syncQueue.bulkDelete(itemIds);
      } catch (error) {
        console.error('Failed to batch sync items', error);
      }
    }
  }

  async fetchInitialData() {
    if (!navigator.onLine) return;
    try {
      const expenses = await sheetsService.getExpenses();
      // Clear and bulk add
      await db.expenses.clear();
      await db.expenses.bulkPut(expenses);
    } catch (error) {
      console.error('Failed to fetch initial data', error);
    }
  }
}

export const syncService = new SyncService();

// Listen for online events to trigger sync
window.addEventListener('online', () => {
  syncService.processQueue();
});
