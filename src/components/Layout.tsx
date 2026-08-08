import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, List, PieChart, Settings, PlusCircle } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'History', path: '/history', icon: List },
    { name: 'Analysis', path: '/analysis', icon: PieChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-background/80 border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate">
              Expense Tracker - Coding Gurus
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon size={18} />
                  {item.name}
                </button>
              );
            })}
            <button 
              onClick={() => navigate('/add')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:scale-105"
            >
              <PlusCircle size={18} />
              Add Expense
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border px-6 py-3 flex justify-between items-center z-50 supports-[backdrop-filter]:bg-background/80">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          // Insert the Add Expense button in the middle
          if (index === 2) {
            return (
              <div key="add-expense" className="flex items-center justify-center -mt-8">
                <button 
                  onClick={() => navigate('/add')}
                  className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
                >
                  <PlusCircle size={28} />
                </button>
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center ml-8 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <item.icon size={24} />
                  <span className="text-[10px] mt-1">{item.name}</span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon size={24} />
              <span className="text-[10px] mt-1">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
