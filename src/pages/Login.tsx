import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../services/googleAuth';
import { Button } from '@/components/ui/button';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      // On success, Firebase auth state listener in App will trigger and redirect to onboarding/dashboard
    } catch (error: any) {
      console.error(error);
      alert(`Failed to login: ${error?.message || error}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="flex flex-col items-center text-center space-y-8 max-w-sm w-full bg-card/50 backdrop-blur-sm p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
        
        <div className="relative w-32 h-32 mb-4 drop-shadow-xl">
          <img src="/logo.png" alt="Expense Tracker" className="w-full h-full object-contain" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Expense Tracker - Coding Gurus</h1>
          <p className="text-muted-foreground text-base">Track your expenses simply and effortlessly.</p>
        </div>

        <Button 
          className="w-full py-6 text-lg rounded-xl shadow-lg mt-8 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" 
          onClick={handleLogin}
        >
          Continue with Google
        </Button>

        <div className="mt-8 text-xs text-muted-foreground flex gap-4">
          <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
          <span>&bull;</span>
          <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
        </div>

      </div>
    </div>
  );
}
