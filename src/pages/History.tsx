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

      {Object.entries(grouped).map(([date, dayExpenses], index) => (
        <div key={date} className="space-y-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationFillMode: 'both', animationDelay: `${index * 150}ms` }}>
          <h3 className="text-sm font-bold text-muted-foreground border-b border-border/50 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            {date}
          </h3>
          
          <div className="space-y-3">
            {dayExpenses.map((expense, i) => (
              <Card 
                key={expense.id} 
                className="glass border-none shadow-sm transition-all duration-300 hover:scale-[1.01] hover:-translate-x-1 hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-right-4"
                style={{ animationFillMode: 'both', animationDelay: `${(index * 150) + (i * 100)}ms` }}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2.5 rounded-2xl transition-colors hover:bg-primary/20">
                      <span className="text-xl drop-shadow-sm">📄</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground/90">{expense.description}</p>
                      <p className="text-xs text-muted-foreground flex gap-2 items-center mt-0.5">
                        <span className="bg-background/50 px-1.5 py-0.5 rounded-md">{expense.category}</span>
                        <span>•</span>
                        <span className="opacity-80">{expense.type}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(expense.amount)}</p>
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
