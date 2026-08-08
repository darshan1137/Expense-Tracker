import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sheetsService } from '../services/googleSheets';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');

  const handleCreateNew = async () => {
    setLoading(true);
    try {
      const id = await sheetsService.createNewSpreadsheet();
      // Store ID in local storage or user profile
      localStorage.setItem('spreadsheetId', id);
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Failed to create spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectExisting = async () => {
    if (!url) return;
    setLoading(true);
    try {
      // Extract ID from URL
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const id = match[1];
        // Validate access
        const data = await sheetsService.verifySpreadsheetAccess(id);
        if (data) {
          localStorage.setItem('spreadsheetId', id);
          sheetsService.setSpreadsheetId(id);
          navigate('/');
        } else {
          alert('Could not access spreadsheet. Ensure you have permission.');
        }
      } else {
        alert('Invalid Google Sheets URL');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-md w-full space-y-8 bg-card/50 backdrop-blur-sm p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
        
        <div className="flex flex-col items-center text-center space-y-4">
          <img src="/logo.png" alt="Expense Tracker Logo" className="w-16 h-16 object-contain drop-shadow-md mb-2" />
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Setup Spreadsheet</h2>
          <p className="text-muted-foreground text-sm">Where should we save your expenses?</p>
        </div>

        <div className="space-y-4 pt-4">
          <Button 
            className="w-full py-6 text-lg" 
            onClick={handleCreateNew}
            disabled={loading}
          >
            Create New Spreadsheet
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">OR</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground text-center">Connect Existing Spreadsheet</p>
            <Input 
              type="url" 
              placeholder="https://docs.google.com/spreadsheets/d/..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <Button 
              variant="outline"
              className="w-full" 
              onClick={handleConnectExisting}
              disabled={loading || !url}
            >
              Connect
            </Button>
          </div>

          <div className="pt-6 text-center">
             <button 
               onClick={async () => {
                 const { signOut } = await import('../services/googleAuth');
                 await signOut();
               }}
               className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
             >
               Sign out to use a different account
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
