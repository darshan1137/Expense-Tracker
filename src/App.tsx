import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { syncService } from './services/syncService';

import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import AddExpense from './pages/AddExpense';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser && localStorage.getItem('spreadsheetId')) {
        // Trigger a background sync to pull latest data from Google Sheets
        syncService.fetchInitialData().catch((err) => {
          console.error('Failed to fetch initial data', err);
          // If the token is invalid/expired, we'll stop sync but avoid forcing a log out
          if (err?.message?.includes('invalid authentication credentials') || err?.message?.includes('401')) {
            console.warn('Auth token expired — sync will fail until re-authenticated.');
            // We removed the auto-logout so the user doesn't get kicked out frequently
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/login" />;
    if (!localStorage.getItem('spreadsheetId')) return <Navigate to="/onboarding" />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/add" element={<AddExpense />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
