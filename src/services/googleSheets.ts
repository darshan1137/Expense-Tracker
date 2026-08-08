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
      throw new Error(error.error?.message || 'Sheets API Error');
    }
    return response.json();
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
      amount: parseFloat(row[5].replace(/[^0-9.-]+/g,"")), // handle currency format if any
      notes: row[6]
    }));
  }
}

export const sheetsService = new GoogleSheetsService();
