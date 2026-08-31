import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { signInWithGoogle } from '../services/googleAuth';
import {
  BarChart3,
  Download,
  ArrowRight,
  Smartphone,
  Shield,
  Zap,
  TrendingUp,
  LogIn,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    desc: 'Visual charts and insights to understand your spending habits at a glance.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'Your data is synced to your own Google Sheet — only you have access.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Add expenses in seconds with our minimal and intuitive interface.',
  },
  {
    icon: TrendingUp,
    title: 'Budget Goals',
    desc: 'Set monthly budgets and track how well you stay on target.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error(error);
      alert(`Failed to login: ${error?.message || error}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO title="Home" />
      {/* ─── Ambient blobs ─────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: 'hsl(262 80% 50%)' }}
        />
        <div
          className="absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ background: 'hsl(300 70% 50%)', animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ background: 'hsl(220 80% 55%)', animationDelay: '2s' }}
        />
      </div>

      {/* ─── Navbar ───────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <img src="/logo.png" alt="Expense Tracker Logo" className="w-9 h-9 object-contain drop-shadow" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Expense Tracker
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex gap-3"
        >
          <button
            id="nav-download-btn"
            onClick={() => {
              const el = document.getElementById('download-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-all duration-200"
          >
            <Download size={15} />
            Download
          </button>
          <button
            id="nav-login-btn"
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            <LogIn size={15} />
            Sign In
          </button>
        </motion.div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium"
        >
          <Sparkles size={14} />
          Free · Powered by Google Sheets
        </motion.div>

        <motion.h1
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
        >
          Manage your{' '}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            expenses
          </span>
          <br />
          effortlessly.
        </motion.h1>

        <motion.p
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-muted-foreground text-lg sm:text-xl max-w-xl mb-12 leading-relaxed"
        >
          A beautiful, lightning-fast expense tracker that syncs to your own Google Sheet.
          Track, analyse, and conquer your finances — on web or Android.
        </motion.p>

        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none justify-center"
        >
          {/* Primary CTA — Login */}
          <button
            id="hero-login-btn"
            onClick={handleLogin}
            className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
          >
            <LogIn size={18} />
            Continue with Google
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          {/* Secondary CTA — APK Download */}
          <a
            id="hero-download-btn"
            href="/ExpenseTracker-v1.1.11.apk"
            download
            className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
          >
            <Smartphone size={18} />
            Download for Android
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-20 flex flex-col items-center gap-2 text-muted-foreground text-xs animate-bounce"
        >
          <ChevronDown size={20} />
        </motion.div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >
          Everything you need,{' '}
          <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            nothing you don't.
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-muted-foreground text-center mb-16 max-w-xl mx-auto"
        >
          Built for simplicity. Designed for clarity.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="flex flex-col gap-4 p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon size={22} />
              </div>
              <h3 className="font-semibold text-base">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Download Section ─────────────────────────────────────── */}
      <section id="download-section" className="relative z-10 px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto rounded-3xl overflow-hidden border border-primary/20 p-px"
          style={{
            background:
              'linear-gradient(135deg, hsl(262 80% 50% / 0.15), hsl(300 70% 50% / 0.08), hsl(220 80% 55% / 0.1))',
          }}
        >
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 text-primary mb-6 mx-auto">
              <Smartphone size={30} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Take it{' '}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                everywhere.
              </span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              Download the native Android app and log expenses on the go — syncs instantly with
              your Google Sheet.
            </p>

            <a
              id="download-apk-btn"
              href="/ExpenseTracker-v1.1.11.apk"
              download
              className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-semibold bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
            >
              <Download size={20} />
              Download APK
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>

            <p className="mt-5 text-xs text-muted-foreground">
              Android 8.0 (Oreo) and above · ~8 MB
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20 text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold mb-6"
        >
          Ready to take control?
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <button
            id="cta-login-btn"
            onClick={handleLogin}
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-semibold bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
          >
            <LogIn size={18} />
            Get started — it's free
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="w-5 h-5 object-contain" />
            <span>© 2025 Expense Tracker · Coding Gurus</span>
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
