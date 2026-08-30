import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { signOut } from '../services/googleAuth';
import { getAuth } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { useCategories } from '../hooks/useCategories';
import { useState } from 'react';
import { Trash2, RotateCcw, Plus, Tag, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const spreadsheetId = localStorage.getItem('spreadsheetId');

  const {
    allCategories,
    hiddenDefaults,
    allDefaults,
    add,
    hideDefault,
    restoreDefault,
    restoreAll,
    removeCustom,
    loading,
  } = useCategories();

  // ── Add category form state ─────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Needs' | 'Wants' | 'Investments'>('Needs');
  const [saving, setSaving] = useState(false);

  // ── Hidden defaults panel ───────────────────────────────────────
  const [hiddenOpen, setHiddenOpen] = useState(false);

  const typeColor = (type: string) => {
    if (type === 'Needs') return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
    if (type === 'Wants') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  };

  const handleAddCategory = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await add({ name: newName.trim(), type: newType });
    setSaving(false);
    setNewName('');
    setNewType('Needs');
    setAddOpen(false);
  };

  const handleRemove = async (name: string, source: 'default' | 'custom') => {
    const confirmMsg = source === 'default'
      ? `Hide "${name}" from your category list? You can restore it later.`
      : `Delete "${name}"? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    if (source === 'default') await hideDefault(name);
    else await removeCustom(name);
  };

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
    if (confirm('Are you sure you want to disconnect this spreadsheet? Your local cache will be cleared.')) {
      await import('../services/googleSheets').then(m => m.sheetsService.clearAppConfig());
      localStorage.removeItem('spreadsheetId');
      navigate('/onboarding');
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-4">

        {/* ── Account ──────────────────────────────────────────────── */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Account</h3>
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center space-x-4">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl">👤</div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Spreadsheet ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Spreadsheet</h3>
          <Card className="bg-card">
            <CardContent className="p-4 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-500">✓</span>
                  <span className="font-medium text-sm">Connected</span>
                </div>
                <Button variant="outline" size="sm" onClick={disconnectSpreadsheet}>Disconnect</Button>
              </div>
              <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded-md">
                ID: {spreadsheetId}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Preferences ──────────────────────────────────────────── */}
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

        {/* ── Categories ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Categories
              {!loading && (
                <span className="ml-2 text-xs font-normal normal-case text-muted-foreground/60">
                  {allCategories.length} active
                  {hiddenDefaults.length > 0 && ` · ${hiddenDefaults.length} hidden`}
                </span>
              )}
            </h3>
            <button
              onClick={() => setAddOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={14} />
              Add new
            </button>
          </div>

          {/* Add new category form */}
          <AnimatePresence>
            {addOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold text-primary">New Category</p>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-cat-name">Name</Label>
                      <Input
                        id="new-cat-name"
                        placeholder="e.g. Pet Supplies"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Needs">Needs (Essentials)</SelectItem>
                          <SelectItem value="Wants">Wants (Lifestyle)</SelectItem>
                          <SelectItem value="Investments">Investments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setAddOpen(false); setNewName(''); }}>
                        Cancel
                      </Button>
                      <Button size="sm" className="flex-1" onClick={handleAddCategory} disabled={!newName.trim() || saving}>
                        {saving ? 'Saving…' : 'Save Category'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active categories list */}
          <Card className="bg-card">
            <CardContent className="p-2 space-y-1">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
              ) : allCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All categories hidden. Restore them below.</p>
              ) : (
                allCategories.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between gap-2 px-2 py-2 rounded-xl hover:bg-secondary/50 transition-colors group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {cat.source === 'default'
                        ? <ShieldCheck size={14} className="text-muted-foreground/50 shrink-0" />
                        : <Tag size={14} className="text-primary shrink-0" />
                      }
                      <span className="font-medium text-sm truncate">{cat.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${typeColor(cat.type)}`}>
                        {cat.type}
                      </span>
                      {cat.source === 'custom' && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                          Mine
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(cat.name, cat.source)}
                      className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                      aria-label={`Remove ${cat.name}`}
                      title={cat.source === 'default' ? 'Hide this category' : 'Delete this category'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Hidden defaults restore panel */}
          {hiddenDefaults.length > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-3">
                <button
                  onClick={() => setHiddenOpen(v => !v)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-amber-600 dark:text-amber-400"
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw size={14} />
                    {hiddenDefaults.length} hidden built-in {hiddenDefaults.length === 1 ? 'category' : 'categories'}
                  </span>
                  {hiddenOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <AnimatePresence>
                  {hiddenOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-1.5">
                        {hiddenDefaults.map(name => {
                          const def = allDefaults.find(d => d.name === name);
                          return (
                            <div key={name} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm text-muted-foreground truncate line-through">{name}</span>
                                {def && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${typeColor(def.type)}`}>
                                    {def.type}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => restoreDefault(name)}
                                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold shrink-0"
                              >
                                <RotateCcw size={11} />
                                Restore
                              </button>
                            </div>
                          );
                        })}
                        <button
                          onClick={restoreAll}
                          className="w-full mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          Restore all hidden categories
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── App (APK download) ───────────────────────────────────── */}
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

        {/* ── Legal ────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Legal</h3>
          <Card className="bg-card">
            <CardContent className="p-0">
              <div
                className="p-4 flex justify-between items-center border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/privacy')}
              >
                <span className="text-sm font-medium">Privacy Policy</span>
                <span className="text-muted-foreground">→</span>
              </div>
              <div
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/terms')}
              >
                <span className="text-sm font-medium">Terms of Service</span>
                <span className="text-muted-foreground">→</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-8">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>

      </div>
    </div>
  );
}
