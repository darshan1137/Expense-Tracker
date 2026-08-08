import { useState, useRef, useEffect } from 'react';
import { useDateFilter } from './DateFilterProvider';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DateRangeSelector() {
  const { startDate, endDate, setStartDate, setEndDate, setDates } = useDateFilter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
      return `${startStr} - ${endStr}`;
    } catch {
      return 'Custom Range';
    }
  };

  const formatCompactDisplayDate = () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startStr} - ${endStr}`;
    } catch {
      return 'Range';
    }
  };

  const handlePreset = (type: string) => {
    const now = new Date();
    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (type === 'today') {
      const today = format(now);
      setDates(today, today);
    } else if (type === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDates(format(first), format(last));
    } else if (type === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setDates(format(first), format(last));
    } else if (type === 'all_time') {
      setDates('2026-08-01', format(now));
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-secondary/30 border-primary/20 hover:bg-secondary/50 transition-all font-medium h-9 text-xs sm:text-sm px-3"
      >
        <CalendarIcon size={16} className="text-primary" />
        <span className="hidden sm:inline">{formatDisplayDate()}</span>
        <span className="sm:hidden max-w-[90px] truncate">{formatCompactDisplayDate()}</span>
        <ChevronDown size={14} className="opacity-50 ml-1" />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 w-72 bg-card border border-border shadow-2xl rounded-xl p-4 animate-in fade-in zoom-in-95 origin-top-left">
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handlePreset('today')}
                className="py-1.5 px-2 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => handlePreset('this_month')}
                className="py-1.5 px-2 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                This Month
              </button>
              <button
                onClick={() => handlePreset('last_month')}
                className="py-1.5 px-2 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Last Month
              </button>
              <button
                onClick={() => handlePreset('all_time')}
                className="py-1.5 px-2 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                All Time
              </button>
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
