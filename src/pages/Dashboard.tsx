import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDateFilter } from '../components/DateFilterProvider';
import { syncService } from '../services/syncService';
import { DEFAULT_CATEGORIES, getCategoryType } from '../utils/categories';
import { Expense } from '../types/expense';
import { Pencil, Trash2, X } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);
  const { startDate, endDate } = useDateFilter();
  
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const loading = expenses === undefined;

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  type SheetMode = 'none' | 'actions' | 'edit';
  const [sheetMode, setSheetMode] = useState<SheetMode>('none');
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'category'>('none');

  // If still loading after 5 seconds, something is wrong — show recovery UI
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    if (timedOut) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold">Taking too long…</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            The local database may be blocked by another tab or browser storage issue.
          </p>
          <div className="space-y-2 w-full max-w-xs">
            <Button className="w-full" onClick={() => window.location.reload()}>Reload Page</Button>
            <Button variant="outline" className="w-full" onClick={async () => {
              // Clear and recreate the DB
              await db.delete();
              window.location.reload();
            }}>
              Clear Local Data &amp; Reload
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Clearing local data won't delete anything from Google Sheets.
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <Select value={groupBy} onValueChange={(val: any) => setGroupBy(val)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="type">Group by Type</SelectItem>
                <SelectItem value="category">Group by Category</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="hover:bg-primary/10 rounded-full transition-colors">View All</Button>
          </div>
        </div>
        <div className="space-y-3">
          {groupBy === 'none' && (
            filteredExpenses.slice(-5).reverse().map((expense, i) => (
              <Card 
                key={expense.id} 
                className="glass border-none shadow-sm transition-all duration-300 hover:scale-[1.01] hover:-translate-x-1 hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-right-4"
                style={{ animationFillMode: 'both', animationDelay: `${i * 100}ms` }}
                onClick={() => {
                  setSelectedExpense(expense);
                  setSheetMode('actions');
                }}
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
            ))
          )}

          {groupBy === 'type' && (() => {
            const recent = filteredExpenses.slice(-20).reverse();
            const grouped = recent.reduce((acc: Record<string, Expense[]>, e) => {
              acc[e.type] = acc[e.type] || [];
              acc[e.type].push(e);
              return acc;
            }, {});
            return Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="space-y-2">
                <h4 className="text-sm font-semibold">{type}</h4>
                <div className="space-y-2">
                  {items.map(item => (
                    <Card key={item.id} className="glass" onClick={() => { setSelectedExpense(item); setSheetMode('actions'); }}>
                      <CardContent className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(item.amount)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ));
          })()}

          {groupBy === 'category' && (() => {
            const recent = filteredExpenses.slice(-20).reverse();
            const grouped = recent.reduce((acc: Record<string, Expense[]>, e) => {
              acc[e.category] = acc[e.category] || [];
              acc[e.category].push(e);
              return acc;
            }, {});
            return Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="space-y-2">
                <h4 className="text-sm font-semibold">{cat}</h4>
                <div className="space-y-2">
                  {items.map(item => (
                    <Card key={item.id} className="glass" onClick={() => { setSelectedExpense(item); setSheetMode('actions'); }}>
                      <CardContent className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(item.amount)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ));
          })()}
          {filteredExpenses.length === 0 && (
             <p className="text-center text-muted-foreground py-8">No expenses in the selected date range.</p>
          )}
        </div>
        </div>

      {sheetMode !== 'none' && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in"
            onClick={() => { setSheetMode('none'); setSelectedExpense(null); setEditForm({}); }}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl border-t border-border animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/50">
              <div>
                <p className="font-bold">{selectedExpense?.description}</p>
                <p className="text-xs text-muted-foreground">{selectedExpense?.date} · {formatCurrency(selectedExpense?.amount ?? 0)}</p>
              </div>
              <button onClick={() => { setSheetMode('none'); setSelectedExpense(null); setEditForm({}); }} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={18} />
              </button>
            </div>

            {sheetMode === 'actions' && (
              <div className="p-5 space-y-3">
                <button
                  onClick={() => {
                    if (!selectedExpense) return;
                    setEditForm({ ...selectedExpense });
                    setSheetMode('edit');
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <Pencil size={20} className="text-primary" />
                  <span className="font-medium">Edit Transaction</span>
                </button>
                <button
                  onClick={async () => {
                    if (!selectedExpense) return;
                    setDeletingId(selectedExpense.id);
                    try {
                      await syncService.deleteExpense(selectedExpense.id);
                      setSheetMode('none');
                      setSelectedExpense(null);
                    } catch (e) {
                      alert('Failed to delete expense.');
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  disabled={deletingId === selectedExpense?.id}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-left text-destructive"
                >
                  <Trash2 size={20} />
                  <span className="font-medium">{deletingId === selectedExpense?.id ? 'Deleting…' : 'Delete Transaction'}</span>
                </button>
              </div>
            )}

            {sheetMode === 'edit' && (
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount (₹)</Label>
                  <Input type="number" step="0.01" min="0" value={editForm.amount || ''} onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={editForm.category || ''} onValueChange={val => setEditForm({ ...editForm, category: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>{cat.name} ({cat.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Input value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-2 pb-4">
                  <Button variant="outline" className="flex-1" onClick={() => setSheetMode('actions')}>Back</Button>
                  <Button className="flex-1" onClick={async () => {
                    if (!editForm.amount || !editForm.category || !editForm.description) return;
                    setSaving(true);
                    try {
                      const type = getCategoryType(editForm.category!);
                      const updated: Expense = {
                        ...selectedExpense!,
                        ...editForm,
                        type: type as any,
                        amount: parseFloat(String(editForm.amount))
                      };
                      await syncService.updateExpense(updated);
                      setSheetMode('none');
                      setSelectedExpense(null);
                    } catch (e) {
                      alert('Failed to update expense.');
                    } finally {
                      setSaving(false);
                    }
                  }} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
