import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { sheetsService } from '../services/googleSheets';
import { refreshGoogleToken, signOut } from '../services/googleAuth';

type Step = 'refreshing' | 'scanning' | 'found' | 'not_found' | 'creating' | 'error';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('refreshing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const autoSetup = async () => {
      try {
        // Step 1: Refresh token so we have the drive.readonly scope
        setStep('refreshing');
        await refreshGoogleToken();

        // Step 2: Scan Drive for an existing tracker
        setStep('scanning');
        const existingId = await sheetsService.findExistingSpreadsheet("My Expense Tracker");

        if (existingId) {
          setStep('found');
          localStorage.setItem('spreadsheetId', existingId);
          sheetsService.setSpreadsheetId(existingId);
          setTimeout(() => navigate('/'), 1000); // brief "found" feedback
        } else {
          // Let user decide: create new or we couldn't find it
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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-sm w-full bg-card border border-border shadow-xl rounded-2xl p-8 text-center space-y-6">

        <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mx-auto drop-shadow-lg" />

        {/* ── Refreshing token ── */}
        {step === 'refreshing' && (
          <>
            <h2 className="text-xl font-bold">Connecting to Google…</h2>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Requesting Drive access to find your existing tracker.</p>
          </>
        )}

        {/* ── Scanning Drive ── */}
        {step === 'scanning' && (
          <>
            <h2 className="text-xl font-bold">Scanning Google Drive…</h2>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Looking for <span className="font-semibold text-foreground">"My Expense Tracker"</span>…</p>
          </>
        )}

        {/* ── Found! ── */}
        {step === 'found' && (
          <>
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-primary">Tracker Found!</h2>
            <p className="text-sm text-muted-foreground">Linking your existing spreadsheet…</p>
          </>
        )}

        {/* ── Not found ── */}
        {step === 'not_found' && (
          <>
            <h2 className="text-xl font-bold">No Existing Tracker Found</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We couldn't find a spreadsheet named <span className="font-semibold text-foreground">"My Expense Tracker"</span> in your Google Drive.
            </p>
            <p className="text-xs text-muted-foreground">If you renamed it or it's in a different account, try signing in with that account.</p>
            <div className="space-y-3 pt-2">
              <Button onClick={handleCreateNew} className="w-full">
                Create New Tracker
              </Button>
              <button
                onClick={handleSignOut}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 w-full"
              >
                Sign out & use a different account
              </button>
            </div>
          </>
        )}

        {/* ── Creating ── */}
        {step === 'creating' && (
          <>
            <h2 className="text-xl font-bold">Creating Your Tracker…</h2>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Setting up your new Google Sheet.</p>
          </>
        )}

        {/* ── Error ── */}
        {step === 'error' && (
          <>
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-bold">Something Went Wrong</h2>
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">{errorMsg}</p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Retry
              </Button>
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
