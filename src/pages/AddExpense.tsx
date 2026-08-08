import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_CATEGORIES, getCategoryType } from '../utils/categories';
import { generateTransactionId } from '../utils/transactionId';
import { syncService } from '../services/syncService';

export default function AddExpense() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.description) return;
    
    setLoading(true);
    try {
      const type = getCategoryType(formData.category);
      const expense = {
        id: generateTransactionId(formData.date),
        date: formData.date,
        description: formData.description,
        category: formData.category,
        type: type,
        amount: parseFloat(formData.amount),
        notes: formData.notes
      };

      await syncService.addExpense(expense);
      alert('Expense added successfully!');
      
      // Clear form but keep the date
      setFormData(prev => ({
        ...prev,
        amount: '',
        category: '',
        description: '',
        notes: ''
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
      <h2 className="text-2xl font-bold mb-6">Add Expense</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl shadow-sm border">
        
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date"
            type="date" 
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input 
            id="amount"
            type="number" 
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={e => setFormData({...formData, amount: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            value={formData.category}
            onValueChange={val => setFormData({...formData, category: val})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_CATEGORIES.map(cat => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name} ({cat.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input 
            id="description"
            placeholder="What was this for?"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input 
            id="notes"
            placeholder="Any additional details..."
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
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
