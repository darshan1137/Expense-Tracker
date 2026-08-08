import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { Expense } from '../types/expense';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const loading = expenses === undefined;

  // Filter for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const needsTotal = currentMonthExpenses.filter(e => e.type === 'Needs').reduce((acc, curr) => acc + curr.amount, 0);
  const wantsTotal = currentMonthExpenses.filter(e => e.type === 'Wants').reduce((acc, curr) => acc + curr.amount, 0);
  const investmentsTotal = currentMonthExpenses.filter(e => e.type === 'Investments').reduce((acc, curr) => acc + curr.amount, 0);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-lg font-medium text-muted-foreground">August 2026</h2>
        <p className="text-sm text-muted-foreground">Total Spent</p>
        <h1 className="text-5xl font-bold text-foreground">{formatCurrency(totalSpent)}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-row md:flex-col justify-between items-center md:items-start md:space-y-2">
            <span className="font-medium text-blue-500">Needs</span>
            <span className="font-bold text-lg md:text-2xl">{formatCurrency(needsTotal)}</span>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-row md:flex-col justify-between items-center md:items-start md:space-y-2">
            <span className="font-medium text-amber-500">Wants</span>
            <span className="font-bold text-lg md:text-2xl">{formatCurrency(wantsTotal)}</span>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex flex-row md:flex-col justify-between items-center md:items-start md:space-y-2">
            <span className="font-medium text-emerald-500">Investments</span>
            <span className="font-bold text-lg md:text-2xl">{formatCurrency(investmentsTotal)}</span>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <h3 className="text-xl font-bold mb-4">Recent Expenses</h3>
        <div className="space-y-4">
          {currentMonthExpenses.slice(-5).reverse().map(expense => (
            <Card key={expense.id} className="bg-card border-none shadow-sm">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {/* Add icon mapping based on category later */}
                    <span className="text-xl">🛒</span>
                  </div>
                  <div>
                    <p className="font-semibold">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">{expense.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(expense.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {currentMonthExpenses.length === 0 && (
             <p className="text-center text-muted-foreground py-8">No expenses this month yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
