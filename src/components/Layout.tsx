import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, PieChart, Settings, Plus, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import DateRangeSelector from './DateRangeSelector';
import { useState, useEffect } from 'react';
import { refreshGoogleToken } from '../services/googleAuth';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  const [authError, setAuthError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleAuthError = () => setAuthError(true);
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const handleReconnect = async () => {
    setRefreshing(true);
    const token = await refreshGoogleToken();
    setRefreshing(false);
    if (token) {
      setAuthError(false);
      window.location.reload(); // Reload to resync
    }
  };

  const navItems = [
    { name: 'Home',     path: '/',          icon: LayoutDashboard },
    { name: 'History',  path: '/history',   icon: History },
    { name: 'Add',      path: '/add',       icon: null },          // FAB slot
    { name: 'Analysis', path: '/analysis',  icon: PieChart },
    { name: 'Settings', path: '/settings',  icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">

      {/* ── Top Header ──────────────────────────────────────────── */}
      {authError && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2.5 text-sm flex justify-between items-center z-50 animate-in slide-in-from-top-2">
          <span className="font-medium">Sync paused: Session expired</span>
          <button onClick={handleReconnect} disabled={refreshing} className="bg-background/20 hover:bg-background/30 px-3 py-1 rounded text-xs font-bold transition-colors">
            {refreshing ? 'Connecting...' : 'Reconnect'}
          </button>
        </div>
      )}
      <header className="sticky top-0 z-40 w-full glass">
        <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-7xl mx-auto w-full">

          {/* Logo + Date picker */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              <span className="hidden sm:inline font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Expense Tracker
              </span>
            </div>
            <DateRangeSelector />
          </div>

          {/* Right side: desktop nav + theme toggle + CTA */}
          <div className="flex items-center gap-2 md:gap-6">

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems
                .filter(item => item.icon !== null)
                .map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon!;
                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.path)}
                      aria-label={item.name}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon size={18} />
                      {item.name}
                    </button>
                  );
                })}
            </nav>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-all hover:scale-110 active:scale-95 text-foreground"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark'
                ? <Sun  size={20} className="animate-in fade-in zoom-in" />
                : <Moon size={20} className="animate-in fade-in zoom-in" />}
            </button>

            {/* Desktop Add CTA */}
            <button
              onClick={() => navigate('/add')}
              className="hidden md:flex items-center gap-2 ml-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        </div>
      </header>

      {/* ── Page Content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-28 md:pb-8 relative">
        <div className="max-w-3xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Frosted glass bar */}
        <div className="glass border-t border-border/30 rounded-t-2xl px-2 pt-3 pb-safe-or-3 flex items-end justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            /* ── FAB (Add) ── */
            if (item.path === '/add') {
              return (
                <button
                  key="fab"
                  onClick={() => navigate('/add')}
                  aria-label="Add expense"
                  className="relative -top-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 ring-4 ring-background transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <Plus size={28} strokeWidth={2.5} />
                </button>
              );
            }

            const Icon = item.icon!;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                aria-label={item.name}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-1 min-w-[52px] py-1 group"
              >
                {/* Active indicator pill */}
                <span
                  className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-primary/15'
                      : 'bg-transparent group-hover:bg-secondary'
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`transition-all duration-200 ${
                      isActive ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
