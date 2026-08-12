import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from '../services/googleAuth';
import { getAuth } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

export default function Settings() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const spreadsheetId = localStorage.getItem('spreadsheetId');

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem('spreadsheetId');
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert('Failed to logout');
    }
  };

  const disconnectSpreadsheet = async () => {
    if (confirm("Are you sure you want to disconnect this spreadsheet? Your local cache will be cleared.")) {
      await import('../services/googleSheets').then(m => m.sheetsService.clearAppConfig());
      localStorage.removeItem('spreadsheetId');
      navigate('/onboarding');
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-4">
        
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Account</h3>
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center space-x-4">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl">
                  👤
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Spreadsheet</h3>
          <Card className="bg-card">
            <CardContent className="p-4 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-500">✓</span>
                  <span className="font-medium text-sm">Connected</span>
                </div>
                <Button variant="outline" size="sm" onClick={disconnectSpreadsheet}>
                  Disconnect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded-md">
                ID: {spreadsheetId}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Preferences</h3>
          <Card className="bg-card">
            <CardContent className="p-0">
              <div className="p-4 flex justify-between items-center border-b border-border">
                <span className="text-sm font-medium">Currency</span>
                <span className="text-sm text-muted-foreground">₹ INR</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium">Dark Mode</span>
                <span className="text-sm text-muted-foreground">System</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {!Capacitor.isNativePlatform() && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">App</h3>
            <Card className="bg-card">
              <CardContent className="p-4">
                <a href="/ExpenseTracker.apk" download className="block">
                  <Button variant="secondary" className="w-full font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                    ⬇️ Download Android APK
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="pt-8">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>

      </div>
    </div>
  );
}
