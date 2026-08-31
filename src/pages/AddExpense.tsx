import { useState } from 'react';
import { SEO } from '../components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '../hooks/useCategories';
import { generateTransactionId } from '../utils/transactionId';
import { syncService } from '../services/syncService';
import { BookmarkPlus } from 'lucide-react';

export default function AddExpense() {
  const [loading, setLoading] = useState(false);
  const { allCategories, add: addCategory } = useCategories();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    notes: '',
    customCategoryName: '',
    customCategoryType: 'Needs' as 'Needs' | 'Wants' | 'Investments'
  });

  const isCustomNew = formData.category === '__new_custom__';

  const handleSaveCustomCategory = async () => {
    if (!formData.customCategoryName.trim()) return;
    await addCategory({
      name: formData.customCategoryName.trim(),
      type: formData.customCategoryType,
    });
    // Switch the category selection to the newly saved one
    setFormData(prev => ({ ...prev, category: prev.customCategoryName.trim() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.description) return;
    if (isCustomNew && !formData.customCategoryName.trim()) return;

    setLoading(true);
    try {
      const isNew = isCustomNew;
      const finalCategory = isNew ? formData.customCategoryName.trim() : formData.category;
      const existingCat = allCategories.find(c => c.name === formData.category);
      const type = isNew
        ? formData.customCategoryType
        : (existingCat?.type ?? 'Needs');

      // Auto-save the custom category so it appears next time
      if (isNew && finalCategory) {
        await addCategory({ name: finalCategory, type });
      }

      const expense = {
        id: generateTransactionId(formData.date),
        date: formData.date,
        description: formData.description,
        category: finalCategory,
        type: type as any,
        amount: parseFloat(formData.amount),
        notes: formData.notes
      };

      await syncService.addExpense(expense);
      alert('Expense added successfully!');

      setFormData(prev => ({
        ...prev,
        amount: '',
        category: '',
        description: '',
        notes: '',
        customCategoryName: '',
        customCategoryType: 'Needs'
      }));
    } catch (error) {
      console.error(error);
      alert('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SEO title="Add Expense" />
      <h2 className="text-2xl font-bold mb-6">Add Expense</h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl shadow-sm border">

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={formData.category}
            onValueChange={val => setFormData({ ...formData, category: val })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {/* Default (visible) + custom categories — grouped by type */}
              {(['Needs', 'Wants', 'Investments'] as const).map(group => {
                const groupCats = allCategories.filter(c => c.type === group);
                if (groupCats.length === 0) return null;
                return (
                  <>
                    <SelectItem key={`__${group}`} value={`__${group}`} disabled className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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

              {/* Add new custom option */}
              <SelectItem value="__new_custom__" className="text-primary font-medium">
                + Add new custom category
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* New custom category fields */}
        {isCustomNew && (
          <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5 animate-in fade-in zoom-in-95">
            <p className="text-sm font-semibold text-primary">New custom category</p>

            <div className="space-y-2">
              <Label htmlFor="customCategoryName">Category Name</Label>
              <Input
                id="customCategoryName"
                placeholder="e.g. Pet Supplies"
                value={formData.customCategoryName}
                onChange={e => setFormData({ ...formData, customCategoryName: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Category Type</Label>
              <Select
                value={formData.customCategoryType}
                onValueChange={(val: any) => setFormData({ ...formData, customCategoryType: val })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Needs">Needs (Essentials)</SelectItem>
                  <SelectItem value="Wants">Wants (Lifestyle)</SelectItem>
                  <SelectItem value="Investments">Investments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save to My Categories button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-primary border-primary/30 hover:bg-primary/10"
              onClick={handleSaveCustomCategory}
              disabled={!formData.customCategoryName.trim()}
            >
              <BookmarkPlus size={15} />
              Save to My Categories
            </Button>
            <p className="text-xs text-muted-foreground -mt-2">
              Saved categories appear in the dropdown every time.
            </p>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="What was this for?"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input
            id="notes"
            placeholder="Any additional details..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full py-6 text-lg rounded-xl" disabled={loading}>
          {loading ? 'Saving...' : 'SAVE EXPENSE'}
        </Button>
      </form>
    </div>
  );
}
