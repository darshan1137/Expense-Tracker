import React, { createContext, useContext, useState, ReactNode } from 'react';

// Default to the first and last day of the current month
const getInitialDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const format = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    start: format(firstDay),
    end: format(lastDay)
  };
};

type DateFilterContextType = {
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setDates: (start: string, end: string) => void;
};

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const initial = getInitialDates();
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);

  const setDates = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <DateFilterContext.Provider value={{ startDate, endDate, setStartDate, setEndDate, setDates }}>
      {children}
    </DateFilterContext.Provider>
  );
}

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (context === undefined) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
};
