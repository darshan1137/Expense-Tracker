import { useState, useMemo } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { CategoryIcon } from '../components/CategoryIcon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDateFilter } from '../components/DateFilterProvider';
import { syncService } from '../services/syncService';
import { useCategories } from '../hooks/useCategories';
import { Expense } from '../types/expense';
import { Pencil, Trash2, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SheetMode = 'none' | 'actions' | 'edit';

export default function History() {
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const loading = expenses === undefined;
  const { startDate, endDate } = useDateFilter();

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>('none');
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { allCategories } = useCategories();

  const sortedExpenses = useMemo(() => {
    return expenses
      ? [...expenses]
          .filter(e => e.date >= startDate && e.date <= endDate)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];
  }, [expenses, startDate, endDate]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const openActions = (expense: Expense) => {
    setSelectedExpense(expense);
    setSheetMode('actions');
  };

  const openEdit = () => {
    if (!selectedExpense) return;
    setEditForm({ ...selectedExpense });
    setSheetMode('edit');
  };

  const closeSheet = () => {
    setSheetMode('none');
    setSelectedExpense(null);
    setEditForm({});
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    const confirmed = window.confirm(`Delete "${selectedExpense.description}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(selectedExpense.id);
    try {
      await syncService.deleteExpense(selectedExpense.id);
      closeSheet();
    } catch {
      alert('Failed to delete expense.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    if (!editForm.amount || !editForm.category || !editForm.description) return;
    setSaving(true);
    try {
      const type = allCategories.find(c => c.name === editForm.category)?.type ?? 'Needs';
      const updated: Expense = {
        ...selectedExpense!,
        ...editForm,
        type: type as any,
        amount: parseFloat(String(editForm.amount))
      };
      await syncService.updateExpense(updated);
      closeSheet();
    } catch {
      alert('Failed to update expense.');
    } finally {
      setSaving(false);
    }
  };

  const availableCategories = useMemo(() =>
    Array.from(new Set(sortedExpenses.map(e => e.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  [sortedExpenses]);

  const filteredExpenses = useMemo(() => sortedExpenses.filter(expense => {
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(expense.type);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(expense.category);
    return matchesType && matchesCategory;
  }), [sortedExpenses, selectedTypes, selectedCategories]);

  // ── Aggregated total of filtered view ──────────────────────────────
  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const filteredGroupedByDate = useMemo(() => filteredExpenses.reduce((acc, expense) => {
    const dateStr = new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>), [filteredExpenses]);

  const [listRef] = useAutoAnimate<HTMLDivElement>();

  if (loading) return <div className="p-4">Loading history...</div>;

  const toggleFilter = (value: string, current: string[], setter: (next: string[]) => void) => {
    setter(current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
  };

  const typeColor = (type: string) => {
    if (type === 'Needs') return 'text-blue-500';
    if (type === 'Wants') return 'text-amber-500';
    return 'text-emerald-500';
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedCategories.length > 0;

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header: Title + Aggregated Total ──────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">History</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={filteredTotal + hasActiveFilters.toString()}
              initial={{ opacity: 0, scale: 0.85, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 4 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                hasActiveFilters
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {hasActiveFilters && (
                <Filter size={12} className="shrink-0" />
              )}
              <span>{formatCurrency(filteredTotal)}</span>
              {hasActiveFilters && (
                <span className="text-xs font-normal opacity-70">
                  · {filteredExpenses.length} txn{filteredExpenses.length !== 1 ? 's' : ''}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Filter Panel ──────────────────────────────────────────── */}
      <div className="space-y-4 rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Filters</p>
            <p className="text-xs text-muted-foreground">Combine type and category filters together</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiltersVisible(v => !v)}
              className="rounded-full flex items-center gap-1"
            >
              {filtersVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {filtersVisible ? 'Hide' : 'View'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="rounded-full"
            >
              Clear all
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {filtersVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-4"
            >
              {/* Type filters */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</p>
                <div className="flex flex-wrap gap-2">
                  {['Needs', 'Wants', 'Investments'].map(type => {
                    const active = selectedTypes.includes(type);
                    return (
                      <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={active ? 'default' : 'outline'}
                        className="rounded-full"
                        onClick={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                      >
                        {type}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Category filters */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</p>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(category => {
                    const active = selectedCategories.includes(category);
                    return (
                      <Button
                        key={category}
                        type="button"
                        size="sm"
                        variant={active ? 'default' : 'outline'}
                        className="rounded-full"
                        onClick={() => toggleFilter(category, selectedCategories, setSelectedCategories)}
                      >
                        {category}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Expense List ──────────────────────────────────────────── */}
      <div ref={listRef} className="space-y-4">
        {Object.entries(filteredGroupedByDate).map(([date, dayExpenses], index) => {
          const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
          return (
            <div key={date} className="space-y-3 animate-in fade-in slide-in-from-bottom-4" style={{ animationFillMode: 'both', animationDelay: `${index * 120}ms` }}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between pb-1 border-b border-border/40">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  {date}
                </span>
                <span className="font-semibold text-foreground/70 text-xs normal-case tracking-normal">
                  {formatCurrency(dayTotal)}
                </span>
              </h3>

              {dayExpenses.map((expense, i) => (
                <Card
                  key={expense.id}
                  className="glass border-none shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-right-4"
                  style={{ animationFillMode: 'both', animationDelay: `${(index * 120) + (i * 80)}ms` }}
                  onClick={() => openActions(expense)}
                >
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                        <CategoryIcon categoryName={expense.category} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground/90">{expense.description}</p>
                        <p className="text-xs text-muted-foreground flex gap-1.5 items-center mt-0.5">
                          <span className="bg-background/50 px-1.5 py-0.5 rounded-md">{expense.category}</span>
                          <span>•</span>
                          <span className={typeColor(expense.type)}>{expense.type}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(expense.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">tap to edit</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })}
      </div>

      {filteredExpenses.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {hasActiveFilters ? 'No expenses match the selected filters.' : 'No expenses in the selected date range.'}
        </p>
      )}

      {/* ── Bottom Sheet ──────────────────────────────────────────── */}
      {sheetMode !== 'none' && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] animate-in fade-in" onClick={closeSheet} />

          <div className="fixed bottom-24 md:bottom-0 left-0 right-0 z-[60] bg-card rounded-t-2xl shadow-2xl border-t border-border animate-in slide-in-from-bottom duration-300 max-h-[calc(90vh-6rem)] md:max-h-[90vh] overflow-y-auto">

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/50">
              <div>
                <p className="font-bold">{selectedExpense?.description}</p>
                <p className="text-xs text-muted-foreground">{selectedExpense?.date} · {formatCurrency(selectedExpense?.amount ?? 0)}</p>
              </div>
              <button onClick={closeSheet} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Actions mode */}
            {sheetMode === 'actions' && (
              <div className="p-5 space-y-3">
                <button
                  onClick={openEdit}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <Pencil size={20} className="text-primary" />
                  <span className="font-medium">Edit Transaction</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingId === selectedExpense?.id}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-left text-destructive"
                >
                  <Trash2 size={20} />
                  <span className="font-medium">
                    {deletingId === selectedExpense?.id ? 'Deleting…' : 'Delete Transaction'}
                  </span>
                </button>
              </div>
            )}

            {/* Edit mode */}
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
                      {(['Needs', 'Wants', 'Investments'] as const).map(group => {
                        const groupCats = allCategories.filter(c => c.type === group);
                        if (groupCats.length === 0) return null;
                        const headerColor = group === 'Needs' ? 'text-emerald-600 dark:text-emerald-400' 
                          : group === 'Wants' ? 'text-amber-600 dark:text-amber-400' 
                          : 'text-blue-600 dark:text-blue-400';
                        return (
                          <>
                            <SelectItem key={`__${group}`} value={`__${group}`} disabled className={`text-xs font-bold uppercase tracking-wider ${headerColor} opacity-100`}>
                              {group}
                            </SelectItem>
                            {groupCats.map(cat => (
                              <SelectItem key={cat.name} value={cat.name}>
                                {cat.name}{cat.source === 'custom' ? ' ★' : ''}
                              </SelectItem>
                            ))}
                          </>
                        );
                      })}
                      {/* Preserve current value if not in list (historical entry) */}
                      {editForm.category && !allCategories.some(c => c.name === editForm.category) && (
                        <SelectItem value={editForm.category}>{editForm.category} (archived)</SelectItem>
                      )}
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
                  <Button className="flex-1" onClick={handleSave} disabled={saving}>
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
