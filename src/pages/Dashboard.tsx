import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDateFilter } from '../components/DateFilterProvider';
import { Expense } from '../types/expense';

export default function Dashboard() {
  const navigate = useNavigate();
  const { startDate, endDate } = useDateFilter();
  
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const loading = expenses === undefined;

  if (loading) return <div className="p-4 md:p-8">Loading dashboard...</div>;

  // Filter by selected date range
  const filteredExpenses = expenses.filter(e => {
    return e.date >= startDate && e.date <= endDate;
  });

  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const needsTotal = filteredExpenses.filter(e => e.type === 'Needs').reduce((acc, curr) => acc + curr.amount, 0);
  const wantsTotal = filteredExpenses.filter(e => e.type === 'Wants').reduce((acc, curr) => acc + curr.amount, 0);
  const investmentsTotal = filteredExpenses.filter(e => e.type === 'Investments').reduce((acc, curr) => acc + curr.amount, 0);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-xs font-medium text-muted-foreground">
          {new Date(startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </h2>
        <p className="text-sm text-muted-foreground">Total Spent</p>
        <h1 className="text-5xl font-bold text-foreground">{formatCurrency(totalSpent)}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 cursor-default">
          <CardContent className="p-4 flex flex-row md:flex-col justify-between items-center md:items-start md:space-y-2">
            <span className="font-medium text-blue-500">Needs</span>
            <span className="font-bold text-lg md:text-2xl">{formatCurrency(needsTotal)}</span>
          </CardContent>
        </Card>
        
        <Card className="glass transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 cursor-default">
          <CardContent className="p-4 flex flex-row md:flex-col justify-between items-center md:items-start md:space-y-2">
            <span className="font-medium text-amber-500">Wants</span>
            <span className="font-bold text-lg md:text-2xl">{formatCurrency(wantsTotal)}</span>
          </CardContent>
        </Card>

        <Card className="glass transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 cursor-default">
          <CardContent className="p-4 flex flex-row md:flex-col justify-between items-center md:items-start md:space-y-2">
            <span className="font-medium text-emerald-500">Investments</span>
            <span className="font-bold text-lg md:text-2xl">{formatCurrency(investmentsTotal)}</span>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Recent Expenses</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="hover:bg-primary/10 rounded-full transition-colors">View All</Button>
        </div>
        <div className="space-y-3">
          {filteredExpenses.slice(-5).reverse().map((expense, i) => (
            <Card 
              key={expense.id} 
              className="glass border-none shadow-sm transition-all duration-300 hover:scale-[1.01] hover:-translate-x-1 hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-right-4"
              style={{ animationFillMode: 'both', animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2.5 rounded-2xl transition-colors hover:bg-primary/20">
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
          {filteredExpenses.length === 0 && (
             <p className="text-center text-muted-foreground py-8">No expenses in the selected date range.</p>
          )}
        </div>
      </div>

    </div>
  );
}
