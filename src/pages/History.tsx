import { Card, CardContent } from '@/components/ui/card';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { Expense } from '../types/expense';

export default function History() {
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const loading = expenses === undefined;

  // We sort in render, but only if loaded
  const sortedExpenses = expenses ? [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (loading) return <div className="p-4">Loading history...</div>;

  // Group by date using sortedExpenses
  const grouped = sortedExpenses.reduce((acc, expense) => {
    const dateStr = new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6">History</h2>

      {Object.entries(grouped).map(([date, dayExpenses]) => (
        <div key={date} className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground border-b border-border pb-2">{date}</h3>
          
          <div className="space-y-3">
            {dayExpenses.map(expense => (
              <Card key={expense.id} className="bg-card border-none shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <span className="text-xl">📄</span>
                    </div>
                    <div>
                      <p className="font-semibold">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">{expense.category} • {expense.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(expense.amount)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {expenses.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No expenses recorded yet.</p>
      )}
    </div>
  );
}
