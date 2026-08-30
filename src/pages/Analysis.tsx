import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { useState, useMemo } from 'react';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDateFilter } from '../components/DateFilterProvider';
import { 
  TrendingUp, TrendingDown, Target, CalendarDays, 
  AlertTriangle, PieChart as PieChartIcon, ArrowUpRight,
  Zap, Calendar, AlertCircle, Activity,
} from 'lucide-react';

export default function Analysis() {
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const loading = expenses === undefined;
  const { startDate, endDate } = useDateFilter();

  const [pieActiveIndex, setPieActiveIndex] = useState<number | null>(null);
  const [trendFilter, setTrendFilter] = useState<'week'|'month'|'year'|'all'>('month');

  // Filter by selected date range
  const currentMonthExpenses = useMemo(() => {
    return expenses ? expenses.filter(e => e.date >= startDate && e.date <= endDate) : [];
  }, [expenses, startDate, endDate]);

  const { totalSpent, needsTotal, wantsTotal, investmentsTotal } = useMemo(() => {
    return {
      totalSpent: currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0),
      needsTotal: currentMonthExpenses.filter(e => e.type === 'Needs').reduce((acc, curr) => acc + curr.amount, 0),
      wantsTotal: currentMonthExpenses.filter(e => e.type === 'Wants').reduce((acc, curr) => acc + curr.amount, 0),
      investmentsTotal: currentMonthExpenses.filter(e => e.type === 'Investments').reduce((acc, curr) => acc + curr.amount, 0)
    };
  }, [currentMonthExpenses]);

  const pieData = useMemo(() => [
    { name: 'Needs', value: needsTotal, color: '#3b82f6' },
    { name: 'Wants', value: wantsTotal, color: '#f59e0b' },
    { name: 'Investments', value: investmentsTotal, color: '#10b981' }
  ].filter(d => d.value > 0), [needsTotal, wantsTotal, investmentsTotal]);

  const categoryTotals = useMemo(() => currentMonthExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>), [currentMonthExpenses]);

  const barData = useMemo(() => Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5), [categoryTotals]);

  // Trend Data based on filter
  const trendData = useMemo(() => {
    if (!expenses) return [];
    const now = new Date();
    let filtered = expenses;
    
    if (trendFilter === 'week') {
      const ago = new Date(); ago.setDate(now.getDate() - 7);
      filtered = expenses.filter(e => e.date >= ago.toISOString().split('T')[0]);
    } else if (trendFilter === 'month') {
      const ago = new Date(); ago.setDate(now.getDate() - 30);
      filtered = expenses.filter(e => e.date >= ago.toISOString().split('T')[0]);
    } else if (trendFilter === 'year') {
      const ago = new Date(); ago.setFullYear(now.getFullYear() - 1);
      filtered = expenses.filter(e => e.date >= ago.toISOString().split('T')[0]);
    }

    const grouped = filtered.reduce((acc, exp) => {
      const d = new Date(exp.date);
      let sortKey = exp.date;
      let label = d.getDate().toString();
      
      if (trendFilter === 'week') {
        label = d.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (trendFilter === 'year') {
        sortKey = exp.date.substring(0, 7); // YYYY-MM
        label = d.toLocaleDateString('en-US', { month: 'short' });
      } else if (trendFilter === 'all') {
        sortKey = d.getFullYear().toString();
        label = sortKey;
      }

      if (!acc[sortKey]) {
        acc[sortKey] = { label, amount: 0, sortKey };
      }
      acc[sortKey].amount += exp.amount;
      return acc;
    }, {} as Record<string, { label: string, amount: number, sortKey: string }>);
    
    return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [expenses, trendFilter]);

  // Premium Insights Math
  const insights = useMemo(() => {
    if (!expenses || expenses.length === 0 || totalSpent === 0) return null;

    // 1. Period-over-Period Trend
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (durationDays - 1));

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const previous = expenses.filter(e => e.date >= fmt(prevStart) && e.date <= fmt(prevEnd));
    const previousTotal = previous.reduce((sum, e) => sum + e.amount, 0);

    const trend = previousTotal === 0 ? 0 : ((totalSpent - previousTotal) / previousTotal) * 100;

    // 2. 50/30/20 Rule Status
    const needsPct = (needsTotal / totalSpent) * 100;
    const wantsPct = (wantsTotal / totalSpent) * 100;
    const invPct = (investmentsTotal / totalSpent) * 100;

    // 3. Weekend Spender (Wants)
    const wants = currentMonthExpenses.filter(e => e.type === 'Wants');
    const weekendWants = wants.filter(e => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6;
    }).reduce((sum, e) => sum + e.amount, 0);
    const weekendWantsPct = wantsTotal === 0 ? 0 : (weekendWants / wantsTotal) * 100;

    // 4. Largest Expense
    const largestExpense = [...currentMonthExpenses].sort((a, b) => b.amount - a.amount)[0];

    // 5. Category Spikes (simplified historical avg)
    const allDates = expenses.map(e => e.date).sort();
    const firstDate = new Date(allDates[0]);
    const totalHistoryDays = Math.max(1, Math.round((new Date().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const allCategoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    let maxSpike = { category: '', percentOver: 0 };
    Object.keys(categoryTotals).forEach(cat => {
      const histTotal = allCategoryTotals[cat];
      const avgPerPeriod = (histTotal / totalHistoryDays) * durationDays;
      if (avgPerPeriod > 0) {
        const percentOver = ((categoryTotals[cat] - avgPerPeriod) / avgPerPeriod) * 100;
        if (percentOver > maxSpike.percentOver && categoryTotals[cat] > 500) {
          maxSpike = { category: cat, percentOver };
        }
      }
    });

    // 6. Concentration
    const sortedCats = Object.values(categoryTotals).sort((a, b) => b - a);
    const top2Total = (sortedCats[0] || 0) + (sortedCats[1] || 0);
    const concentrationPct = (top2Total / totalSpent) * 100;

    // 7. Projected Spend (Burn Rate)
    const today = new Date();
    let projectedTotal = totalSpent;
    if (today <= end && today >= start) {
      const daysPassed = Math.max(1, today.getDate());
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const dailyBurn = totalSpent / daysPassed;
      projectedTotal = dailyBurn * daysInMonth;
    }

    return {
      trend,
      needsPct, wantsPct, invPct,
      weekendWantsPct,
      largestExpense,
      maxSpike,
      concentrationPct,
      projectedTotal
    };
  }, [expenses, startDate, endDate, totalSpent, needsTotal, wantsTotal, investmentsTotal, categoryTotals, currentMonthExpenses]);

  if (loading) return <div className="p-4 md:p-8">Loading analysis...</div>;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

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

  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="glass px-4 py-3 rounded-xl border border-border shadow-xl">
          <p className="font-medium text-foreground mb-1">{item.label}</p>
          <p className="text-primary font-bold text-lg">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6">Monthly Analysis</h2>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass cursor-default transition-all duration-300 hover:shadow-xl lg:col-span-1">
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
                        stroke={pieActiveIndex === index ? 'rgba(0,0,0,0.06)' : 'transparent'}
                        strokeWidth={pieActiveIndex === index ? 8 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} animationDuration={120} />
                </PieChart>
              </ResponsiveContainer>
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

        <Card className="glass cursor-default transition-all duration-300 hover:shadow-xl lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Spending Trend</CardTitle>
            <Select value={trendFilter} onValueChange={(val: any) => setTrendFilter(val)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Past 7 Days</SelectItem>
                <SelectItem value="month">Past 30 Days</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.6, fontSize: 12}} dy={10} />
                  <YAxis hide />
                  <Tooltip content={<TrendTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "var(--background)", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass cursor-default transition-all duration-300 hover:shadow-xl lg:col-span-3">
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
      </div>

      {/* Premium Insights Bento Grid */}
      {insights && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-primary">✨</span> Premium Insights
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Trend Card */}
            <div className="glass p-5 rounded-2xl border border-border/50 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${insights.trend > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays size={14} /> Period Trend
                  </p>
                  <h4 className="text-xl font-bold mt-2 text-foreground">
                    {Math.abs(Math.round(insights.trend))}% {insights.trend > 0 ? 'Higher' : 'Lower'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    Compared to the previous period of the same length.
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${insights.trend > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {insights.trend > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
              </div>
            </div>

            {/* 50/30/20 Rule */}
            <div className="glass p-5 rounded-2xl border border-border/50 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Target size={14} /> Budget Framework
                  </p>
                  <h4 className="text-xl font-bold mt-2 text-foreground flex items-baseline gap-2">
                    50/30/20 Rule
                  </h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Needs ({Math.round(insights.needsPct)}%)</span>
                      <span className={insights.needsPct > 50 ? 'text-red-400 font-medium' : 'text-emerald-400'}>Target 50%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Wants ({Math.round(insights.wantsPct)}%)</span>
                      <span className={insights.wantsPct > 30 ? 'text-red-400 font-medium' : 'text-emerald-400'}>Target 30%</span>
                    </div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <PieChartIcon size={20} />
                </div>
              </div>
            </div>

            {/* Weekend Spender */}
            <div className="glass p-5 rounded-2xl border border-border/50 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar size={14} /> Behavioral Insight
                  </p>
                  <h4 className="text-xl font-bold mt-2 text-foreground">
                    Weekend Spender
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    <span className="text-purple-400 font-bold">{Math.round(insights.weekendWantsPct)}%</span> of your discretionary spending (Wants) occurs on weekends.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                  <Zap size={20} />
                </div>
              </div>
            </div>

            {/* Category Spikes */}
            <div className="glass p-5 rounded-2xl border border-border/50 relative overflow-hidden group hover:shadow-lg transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Spike Detector
                  </p>
                  {insights.maxSpike.percentOver > 20 ? (
                    <>
                      <h4 className="text-xl font-bold mt-2 text-foreground">
                        {insights.maxSpike.category}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        is trending <span className="text-orange-400 font-bold">{Math.round(insights.maxSpike.percentOver)}% higher</span> than your historical average.
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-xl font-bold mt-2 text-foreground">
                        Looking Good
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        No major unusual spending spikes detected compared to historical averages.
                      </p>
                    </>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                  <AlertCircle size={20} />
                </div>
              </div>
            </div>

            {/* Projected Spend & Concentration (combined wide card) */}
            <div className="glass p-5 rounded-2xl border border-border/50 relative overflow-hidden group hover:shadow-lg transition-all duration-300 lg:col-span-2 flex flex-col justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="grid grid-cols-2 gap-4 relative z-10 divide-x divide-border/50">
                <div className="pr-4">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Activity size={14} /> Projected Monthly Spend</p>
                  <p className="text-xl font-bold mt-1 text-foreground">
                    {formatCurrency(insights.projectedTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Based on your current daily burn rate.
                  </p>
                </div>
                <div className="pl-4">
                  <p className="text-sm font-medium text-muted-foreground">Spending Concentration</p>
                  <p className="text-xl font-bold mt-1 text-foreground">
                    {Math.round(insights.concentrationPct)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    of your total spend comes from just your top 2 categories.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
