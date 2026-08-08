import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { Expense } from '../types/expense';

export default function Analysis() {
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const loading = expenses === undefined;

  if (loading) return <div className="p-4 md:p-8">Loading analysis...</div>;

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

  const pieData = [
    { name: 'Needs', value: needsTotal, color: '#3b82f6' },
    { name: 'Wants', value: wantsTotal, color: '#f59e0b' },
    { name: 'Investments', value: investmentsTotal, color: '#10b981' }
  ].filter(d => d.value > 0);

  const categoryTotals = currentMonthExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (loading) return <div className="p-4">Loading analysis...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6">Monthly Analysis</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-4 w-full justify-center flex-wrap">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name} ({Math.round((d.value/totalSpent)*100)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <span>✨</span> <span>Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {barData.length > 0 ? (
                 <p className="text-sm text-foreground">
                   <span className="font-bold">{barData[0].name}</span> was your highest spending category this month.
                 </p>
               ) : (
                 <p className="text-sm text-muted-foreground">Add expenses to see insights.</p>
               )}
               {totalSpent > 0 && (
                 <p className="text-sm text-foreground">
                   You directed <span className="font-bold text-emerald-500">{Math.round((investmentsTotal/totalSpent)*100)}%</span> of your funds towards Investments.
                 </p>
               )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
