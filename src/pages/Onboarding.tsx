import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sheetsService } from '../services/googleSheets';
import { refreshGoogleToken, signOut } from '../services/googleAuth';

type Step = 'scanning' | 'choose' | 'creating';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('scanning');
  const [manualUrl, setManualUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const autoDetect = async () => {
      try {
        // Get a fresh token with drive.appdata scope
        await refreshGoogleToken();

        // Check the hidden app data folder for a previously saved config
        const config = await sheetsService.getAppConfig();
        if (config?.spreadsheetId) {
          // Verify it's still accessible
          const valid = await sheetsService.verifySpreadsheetAccess(config.spreadsheetId);
          if (valid) {
            localStorage.setItem('spreadsheetId', config.spreadsheetId);
            sheetsService.setSpreadsheetId(config.spreadsheetId);
            navigate('/');
            return;
          }
        }
      } catch (e) {
        console.error('Auto-detect failed', e);
      }
      // Fall through: show the manual options
      setStep('choose');
    };
    autoDetect();
  }, [navigate]);

  const handleCreateNew = async () => {
    setStep('creating');
    try {
      const id = await sheetsService.createNewSpreadsheet("My Expense Tracker");
      localStorage.setItem('spreadsheetId', id);
      // Save to hidden app folder for future auto-detection
      await sheetsService.saveAppConfig({ spreadsheetId: id });
      navigate('/');
    } catch (e: any) {
      alert('Failed to create spreadsheet: ' + (e?.message || 'Unknown error'));
      setStep('choose');
    }
  };

  const handleManualConnect = async () => {
    if (!manualUrl.trim()) return;
    setLoading(true);
    try {
      const match = manualUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        alert('Invalid URL. Please paste the full Google Sheets URL from your browser address bar.');
        setLoading(false);
        return;
      }
      const id = match[1];
      const data = await sheetsService.verifySpreadsheetAccess(id);
      if (data) {
        localStorage.setItem('spreadsheetId', id);
        sheetsService.setSpreadsheetId(id);
        // Save to hidden app folder so it auto-detects next time
        await sheetsService.saveAppConfig({ spreadsheetId: id });
        navigate('/');
      } else {
        alert('Could not access that spreadsheet. Make sure you are the owner and have edit access.');
      }
    } catch (e: any) {
      alert('Failed to connect: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-sm w-full bg-card border border-border shadow-xl rounded-2xl p-8 space-y-6">

        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain mx-auto drop-shadow-lg" />
          <h2 className="text-xl font-bold">Setup Your Tracker</h2>
        </div>

        {/* Scanning */}
        {step === 'scanning' && (
          <div className="text-center space-y-4 py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Checking for your existing tracker…</p>
          </div>
        )}

        {/* Creating */}
        {step === 'creating' && (
          <div className="text-center space-y-4 py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Creating your Google Sheet…</p>
          </div>
        )}

        {/* Manual choose */}
        {step === 'choose' && (
          <>
            <p className="text-sm text-muted-foreground text-center">
              No existing tracker was found. Connect one or start fresh.
            </p>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Connect Existing Spreadsheet</label>
              <p className="text-xs text-muted-foreground">
                Open your spreadsheet in Google Drive, copy the URL and paste it below.
              </p>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
              />
              <Button
                onClick={handleManualConnect}
                disabled={loading || !manualUrl.trim()}
                className="w-full"
              >
                {loading ? 'Connecting…' : 'Connect This Spreadsheet'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button variant="outline" onClick={handleCreateNew} className="w-full">
              Create a New Tracker
            </Button>

            <div className="text-center pt-2">
              <button
                onClick={signOut}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Sign out & use a different account
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
