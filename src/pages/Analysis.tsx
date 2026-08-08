import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useState } from 'react';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDateFilter } from '../components/DateFilterProvider';
import { Expense } from '../types/expense';

export default function Analysis() {
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const loading = expenses === undefined;
  const { startDate, endDate } = useDateFilter();

  const [pieActiveIndex, setPieActiveIndex] = useState<number | null>(null);

  if (loading) return <div className="p-4 md:p-8">Loading analysis...</div>;

  // Filter by selected date range
  const currentMonthExpenses = expenses.filter(e => {
    return e.date >= startDate && e.date <= endDate;
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass px-4 py-3 rounded-xl border border-border shadow-xl transition-opacity duration-150" style={{ pointerEvents: 'none' }}>
          <p className="font-bold text-foreground mb-1">{payload[0].payload.name || label}</p>
          <p className="text-primary font-semibold text-lg">{formatCurrency(payload[0].value)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round((payload[0].value / totalSpent) * 100)}% of total spend
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6">Monthly Analysis</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass cursor-default transition-all duration-300 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center relative">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    onMouseEnter={(_, index) => setPieActiveIndex(index)}
                    onMouseLeave={() => setPieActiveIndex(null)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-all duration-300 cursor-pointer"
                        // slightly enlarge hovered slice by increasing radius via style (visual effect)
                        stroke={pieActiveIndex === index ? 'rgba(0,0,0,0.06)' : 'transparent'}
                        strokeWidth={pieActiveIndex === index ? 8 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} animationDuration={120} />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Label for Donut Chart */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-2rem]">
                <span className="text-xs text-muted-foreground font-medium">Total</span>
                <span className="text-xl font-bold text-foreground">{formatCurrency(totalSpent)}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-6 w-full justify-center flex-wrap">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center space-x-2 text-xs font-medium bg-secondary/50 px-3 py-1.5 rounded-full transition-colors hover:bg-secondary">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-foreground">{d.name} <span className="opacity-70 ml-1">({Math.round((d.value/totalSpent)*100)}%)</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass cursor-default transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.7}/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} tick={{fill: 'currentColor', opacity: 0.8}} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} animationDuration={120} />
                    <Bar dataKey="value" fill="url(#colorValue)" radius={[0, 8, 8, 0]} isAnimationActive={true} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass bg-primary/5 border-primary/20 overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center space-x-2 relative z-10">
                <span className="text-lg">✨</span> <span>Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
               {barData.length > 0 ? (
                 <p className="text-sm text-foreground/90 leading-relaxed">
                   <span className="font-bold text-primary">{barData[0].name}</span> was your highest spending category this month, making up <span className="font-bold text-primary">{Math.round((barData[0].value/totalSpent)*100)}%</span> of your total expenses.
                 </p>
               ) : (
                 <p className="text-sm text-muted-foreground">Add expenses to see insights.</p>
               )}
               {totalSpent > 0 && (
                 <p className="text-sm text-foreground/90 leading-relaxed">
                   You directed <span className="font-bold text-emerald-500">{Math.round((investmentsTotal/totalSpent)*100)}%</span> of your funds towards Investments. Keep it up!
                 </p>
               )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
