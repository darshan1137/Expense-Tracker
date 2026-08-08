import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, List, PieChart, Settings, PlusCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'History', path: '/history', icon: List },
    { name: 'Analysis', path: '/analysis', icon: PieChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full glass">
        <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
            <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 truncate">
              Expense Tracker
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="flex items-center gap-2 md:gap-6">
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'animate-pulse' : ''} />
                    {item.name}
                  </button>
                );
              })}
            </nav>
            
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-all hover:scale-110 active:scale-95 text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} className="animate-in fade-in zoom-in" /> : <Moon size={20} className="animate-in fade-in zoom-in" />}
            </button>

            <button 
              onClick={() => navigate('/add')}
              className="hidden md:flex ml-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-full text-sm font-medium items-center gap-2 shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-95"
            >
              <PlusCircle size={18} />
              Add Expense
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass px-6 py-4 flex justify-between items-center z-50 rounded-t-3xl border-b-0 pb-safe">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          // Insert the Add Expense button in the middle
          if (index === 2) {
            return (
              <div key="add-expense" className="flex items-center justify-center -mt-12 relative z-10">
                <button 
                  onClick={() => navigate('/add')}
                  className="bg-primary text-primary-foreground rounded-full p-4 shadow-xl shadow-primary/30 transition-all duration-300 hover:scale-110 active:scale-95 ring-4 ring-background"
                >
                  <PlusCircle size={32} />
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon size={24} className={`mb-1 transition-transform ${isActive ? '-translate-y-1' : ''}`} />
              <span className={`text-[10px] font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
