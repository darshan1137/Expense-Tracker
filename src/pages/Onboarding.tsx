import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sheetsService } from '../services/googleSheets';
import { refreshGoogleToken, signOut } from '../services/googleAuth';

type Step = 'refreshing' | 'scanning' | 'found' | 'not_found' | 'creating' | 'error';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('refreshing');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    const autoSetup = async () => {
      try {
        setStep('refreshing');
        await refreshGoogleToken();

        setStep('scanning');
        const existingId = await sheetsService.findExistingSpreadsheet("My Expense Tracker");

        if (existingId) {
          setStep('found');
          localStorage.setItem('spreadsheetId', existingId);
          sheetsService.setSpreadsheetId(existingId);
          setTimeout(() => navigate('/'), 1000);
        } else {
          setStep('not_found');
        }
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message || 'An unexpected error occurred.');
        setStep('error');
      }
    };
    autoSetup();
  }, [navigate]);

  const handleCreateNew = async () => {
    setStep('creating');
    try {
      const id = await sheetsService.createNewSpreadsheet("My Expense Tracker");
      localStorage.setItem('spreadsheetId', id);
      navigate('/');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to create spreadsheet.');
      setStep('error');
    }
  };

  const handleManualConnect = async () => {
    if (!manualUrl.trim()) return;
    setManualLoading(true);
    try {
      const match = manualUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        alert('Invalid Google Sheets URL. Please paste the full URL from your browser.');
        setManualLoading(false);
        return;
      }
      const id = match[1];
      const data = await sheetsService.verifySpreadsheetAccess(id);
      if (data) {
        localStorage.setItem('spreadsheetId', id);
        sheetsService.setSpreadsheetId(id);
        navigate('/');
      } else {
        alert('Could not access that spreadsheet. Make sure you have edit access.');
      }
    } catch (e) {
      alert('Failed to connect. Please check the URL and try again.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-sm w-full bg-card border border-border shadow-xl rounded-2xl p-8 text-center space-y-6">

        <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mx-auto drop-shadow-lg" />

        {/* Refreshing */}
        {step === 'refreshing' && (
          <>
            <h2 className="text-xl font-bold">Connecting to Google…</h2>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Requesting Drive access to find your existing tracker.</p>
          </>
        )}

        {/* Scanning */}
        {step === 'scanning' && (
          <>
            <h2 className="text-xl font-bold">Scanning Google Drive…</h2>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Looking for <span className="font-semibold text-foreground">"My Expense Tracker"</span>…</p>
          </>
        )}

        {/* Found */}
        {step === 'found' && (
          <>
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-primary">Tracker Found!</h2>
            <p className="text-sm text-muted-foreground">Linking your existing spreadsheet…</p>
          </>
        )}

        {/* Not found — show manual fallback */}
        {step === 'not_found' && (
          <>
            <h2 className="text-xl font-bold">Couldn't Detect Automatically</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We didn't find <span className="font-semibold text-foreground">"My Expense Tracker"</span> in your Drive. This may happen if the Google Drive API is not enabled for this project, or if the sheet has a slightly different name.
            </p>

            {/* Manual URL paste */}
            <div className="space-y-2 text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paste your spreadsheet URL</p>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
              />
              <Button
                onClick={handleManualConnect}
                disabled={manualLoading || !manualUrl.trim()}
                className="w-full"
              >
                {manualLoading ? 'Connecting…' : 'Connect This Spreadsheet'}
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
              Create a Brand New Tracker
            </Button>

            <button
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Sign out & try a different account
            </button>
          </>
        )}

        {/* Creating */}
        {step === 'creating' && (
          <>
            <h2 className="text-xl font-bold">Creating Your Tracker…</h2>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Setting up your new Google Sheet.</p>
          </>
        )}

        {/* Error */}
        {step === 'error' && (
          <>
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-bold">Something Went Wrong</h2>
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">{errorMsg}</p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">Retry</Button>
              <button
                onClick={handleSignOut}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 w-full"
              >
                Sign out & try a different account
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
