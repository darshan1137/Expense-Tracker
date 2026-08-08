import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { sheetsService } from '../services/googleSheets';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Scanning Google Drive...');

  useEffect(() => {
    const autoSetup = async () => {
      try {
        setStatus('Scanning Google Drive for existing tracker...');
        const existingId = await sheetsService.findExistingSpreadsheet("My Expense Tracker");
        
        if (existingId) {
          setStatus('Found existing tracker! Linking...');
          localStorage.setItem('spreadsheetId', existingId);
          sheetsService.setSpreadsheetId(existingId);
          navigate('/');
        } else {
          setStatus('No existing tracker found. Creating a new one...');
          const id = await sheetsService.createNewSpreadsheet("My Expense Tracker");
          localStorage.setItem('spreadsheetId', id);
          navigate('/');
        }
      } catch (e) {
        console.error(e);
        setStatus('Failed to setup automatically. Please try manually or check permissions.');
        setLoading(false);
      }
    };
    
    autoSetup();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-sm text-center">
        <h2 className="text-2xl font-bold mb-4">Setup Your Tracker</h2>
        
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">{status}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-destructive mb-4">{status}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry Auto-Setup
            </Button>
            
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
        )}
      </div>
    </div>
  );
}
