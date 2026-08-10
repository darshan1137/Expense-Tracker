import { Expense } from '../types/expense';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// A simple wrapper for Sheets API using fetch
export class GoogleSheetsService {
  private accessToken: string | null = null;
  private spreadsheetId: string | null = null;
  constructor() {
    this.accessToken = localStorage.getItem('googleAccessToken');
    this.spreadsheetId = localStorage.getItem('spreadsheetId');
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  setSpreadsheetId(id: string) {
    this.spreadsheetId = id;
  }

  getSpreadsheetId() {
    return this.spreadsheetId;
  }

  private async fetchAPI(url: string, options: RequestInit = {}) {
    this.accessToken = this.accessToken || localStorage.getItem('googleAccessToken');
    if (!this.accessToken) throw new Error("No access token");
    
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.accessToken}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets${url}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error.error?.message?.includes('401') || error.error?.message?.includes('invalid authentication credentials')) {
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
      throw new Error(error.error?.message || 'Sheets API Error');
    }
    return response.json();
  }

  private async fetchDriveAPI(url: string, options: RequestInit = {}) {
    this.accessToken = this.accessToken || localStorage.getItem('googleAccessToken');
    if (!this.accessToken) throw new Error("No access token");
    
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.accessToken}`);

    const response = await fetch(`https://www.googleapis.com/drive/v3/files${url}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error.error?.message?.includes('401') || error.error?.message?.includes('invalid authentication credentials')) {
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
      throw new Error(error.error?.message || 'Drive API Error');
    }
    return response.json();
  }

  // Read the saved spreadsheet ID from the hidden app data folder
  async getAppConfig(): Promise<{ spreadsheetId: string } | null> {
    try {
      // List files in the hidden appDataFolder
      const list = await this.fetchDriveAPI('?spaces=appDataFolder&q=name=%27expense-tracker-config.json%27&fields=files(id)');
      if (!list.files || list.files.length === 0) return null;

      const fileId = list.files[0].id;
      // Download the file content
      this.accessToken = this.accessToken || localStorage.getItem('googleAccessToken');
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Error reading app config from Drive', e);
      return null;
    }
  }

  // Save the spreadsheet ID to the hidden app data folder (creates or replaces)
  async saveAppConfig(data: { spreadsheetId: string }) {
    try {
      this.accessToken = this.accessToken || localStorage.getItem('googleAccessToken');
      const content = JSON.stringify(data);

      // Check if the file already exists
      const list = await this.fetchDriveAPI('?spaces=appDataFolder&q=name=%27expense-tracker-config.json%27&fields=files(id)');
      
      if (list.files && list.files.length > 0) {
        // Update existing file
        const fileId = list.files[0].id;
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: content
        });
      } else {
        // Create new file in appDataFolder
        const metadata = { name: 'expense-tracker-config.json', parents: ['appDataFolder'] };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.accessToken}` },
          body: form
        });
      }
    } catch (e) {
      console.error('Error saving app config to Drive', e);
    }
  }

  async verifySpreadsheetAccess(id: string) {
    try {
      const data = await this.fetchAPI(`/${id}`);
      return data;
    } catch (e) {
      return null;
    }
  }

  async createNewSpreadsheet(title: string = "My Expense Tracker") {
    const data = await this.fetchAPI('', {
      method: 'POST',
      body: JSON.stringify({
        properties: { title },
        sheets: [
          { properties: { title: 'Transactions' } },
          { properties: { title: 'Categories' } }
        ]
      })
    });
    this.spreadsheetId = data.spreadsheetId;
    
    // Add Headers
    await this.fetchAPI(`/${this.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            updateCells: {
              range: { sheetId: data.sheets[0].properties.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 7 },
              rows: [{ values: ['ID', 'Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'].map(v => ({ userEnteredValue: { stringValue: v } })) }],
              fields: 'userEnteredValue'
            }
          },
          {
             updateCells: {
              range: { sheetId: data.sheets[1].properties.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 },
              rows: [{ values: ['Category', 'Type'].map(v => ({ userEnteredValue: { stringValue: v } })) }],
              fields: 'userEnteredValue'
            }
          }
        ]
      })
    });

    return data.spreadsheetId;
  }

  async addExpense(expense: Expense) {
    await this.batchAddExpenses([expense]);
  }

  async batchAddExpenses(expenses: Expense[]) {
    if (!this.spreadsheetId) throw new Error("No spreadsheet connected");
    if (expenses.length === 0) return;
    
    const values = expenses.map(expense => [
      expense.id,
      expense.date,
      expense.description,
      expense.category,
      expense.type,
      expense.amount,
      expense.notes || ''
    ]);

    await this.fetchAPI(`/${this.spreadsheetId}/values/Transactions!A:G:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({ values })
    });
  }

  async getExpenses(): Promise<Expense[]> {
    if (!this.spreadsheetId) throw new Error("No spreadsheet connected");
    
    const data = await this.fetchAPI(`/${this.spreadsheetId}/values/Transactions!A2:G`);
    const rows = data.values || [];
    
    return rows.map((row: any[]) => ({
      id: row[0],
      date: row[1],
      description: row[2],
      category: row[3],
      type: row[4],
      amount: parseFloat(String(row[5]).replace(/[^0-9.-]+/g, "")),
      notes: row[6]
    }));
  }

  // Find which row a given expense ID is in (1-indexed, accounting for header row)
  private async findRowIndexById(id: string): Promise<number | null> {
    const data = await this.fetchAPI(`/${this.spreadsheetId}/values/Transactions!A:A`);
    const rows: string[][] = data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === id);
    return rowIndex === -1 ? null : rowIndex + 1; // 1-indexed in Sheets API
  }

  async updateExpense(expense: Expense) {
    if (!this.spreadsheetId) throw new Error("No spreadsheet connected");
    const rowIndex = await this.findRowIndexById(expense.id);
    if (rowIndex === null) {
      // If not found in sheet, just add it
      await this.batchAddExpenses([expense]);
      return;
    }
    const range = `Transactions!A${rowIndex}:G${rowIndex}`;
    await this.fetchAPI(`/${this.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        values: [[
          expense.id, expense.date, expense.description,
          expense.category, expense.type, expense.amount, expense.notes || ''
        ]]
      })
    });
  }

  async deleteExpense(id: string) {
    if (!this.spreadsheetId) throw new Error("No spreadsheet connected");
    const rowIndex = await this.findRowIndexById(id);
    if (rowIndex === null) return; // Already gone
    // Get sheet metadata to find sheetId
    const meta = await this.fetchAPI(`/${this.spreadsheetId}?fields=sheets.properties`);
    const sheetId = meta.sheets[0].properties.sheetId;
    await this.fetchAPI(`/${this.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-indexed
              endIndex: rowIndex
            }
          }
        }]
      })
    });
  }
}

export const sheetsService = new GoogleSheetsService();

