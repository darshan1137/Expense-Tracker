import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { DateFilterProvider } from './components/DateFilterProvider.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="expense-tracker-theme">
      <DateFilterProvider>
        <App />
      </DateFilterProvider>
    </ThemeProvider>
  </StrictMode>,
);
