import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { syncService } from './services/syncService';
import { useAppUpdater } from './hooks/useAppUpdater';
import UpdateDialog from './components/UpdateDialog';
import { CategoriesProvider } from './context/CategoriesContext';
import { Capacitor } from '@capacitor/core';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import AddExpense from './pages/AddExpense';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { updateInfo, dismiss } = useAppUpdater();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser && localStorage.getItem('spreadsheetId')) {
        // Trigger a background sync to pull latest data from Google Sheets
        syncService.fetchInitialData().catch((err) => {
          console.error('Failed to fetch initial data', err);
          if (err?.message?.includes('invalid authentication credentials') || err?.message?.includes('401')) {
            console.warn('Auth token expired — sync will fail until re-authenticated.');
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
    <>
      {/* Global update dialog — shown on every screen */}
      <UpdateDialog updateInfo={updateInfo} onDismiss={dismiss} />

      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          {/* Root: native app → login, web → landing (or dashboard if already logged in) */}
          <Route
            path="/"
            element={
              user
                ? localStorage.getItem('spreadsheetId')
                  ? <Navigate to="/dashboard" />
                  : <Navigate to="/onboarding" />
                : Capacitor.isNativePlatform()
                  ? <Navigate to="/login" />
                  : <LandingPage />
            }
          />
          <Route 
            path="/login" 
            element={
              !user 
                ? <Login /> 
                : localStorage.getItem('spreadsheetId') 
                  ? <Navigate to="/dashboard" /> 
                  : <Navigate to="/onboarding" />
            } 
          />
          <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Protected app routes — CategoriesProvider owns 1 Firestore listener */}
          <Route element={<ProtectedRoute><CategoriesProvider><Layout /></CategoriesProvider></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/add" element={<AddExpense />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
