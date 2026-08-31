import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import type { UpdateInfo } from '../hooks/useAppUpdater';
import { CURRENT_APP_VERSION } from '../hooks/useAppUpdater';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { Capacitor } from '@capacitor/core';

interface UpdateDialogProps {
  updateInfo: UpdateInfo | null;
  onDismiss: () => void;
}

export default function UpdateDialog({ updateInfo, onDismiss }: UpdateDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fallbackPrompt, setFallbackPrompt] = useState(false);

  if (!updateInfo) return null;

  const handleDownload = async () => {
    if (!Capacitor.isNativePlatform()) {
      window.open(updateInfo.apkUrl, '_blank');
      onDismiss();
      return;
    }

    setDownloading(true);
    setProgress(0);
    setFallbackPrompt(false);

    try {
      const progressListener = await Filesystem.addListener('progress', (status) => {
        if (status.contentLength > 0) {
          setProgress(status.bytes / status.contentLength);
        }
      });

      const cacheBustedUrl = `${updateInfo.apkUrl}?t=${Date.now()}`;

      const result = await Filesystem.downloadFile({
        url: cacheBustedUrl,
        path: 'ExpenseTracker-update.apk',
        directory: Directory.Cache,
        progress: true
      });

      progressListener.remove();

      await FileOpener.openFile({ path: result.path });
      onDismiss();
    } catch (err) {
      console.error('Download or install failed', err);
      setFallbackPrompt(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {updateInfo && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={!downloading ? onDismiss : undefined}
          />

          {/* Dialog card */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-[101] bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md w-full px-4 pb-6 sm:pb-0"
          >
            <div className="bg-card border border-border/60 rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
              
              {/* Header gradient strip */}
              <div className="relative h-2 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

              <div className="p-6">
                {/* Close button */}
                <button
                  id="update-dialog-close"
                  onClick={onDismiss}
                  disabled={downloading}
                  className="absolute top-5 right-5 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50"
                  aria-label="Dismiss update"
                >
                  <X size={18} />
                </button>

                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-0.5">Update Available</p>
                    <h2 className="text-xl font-bold text-foreground">
                      Version {updateInfo.version}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You're on v{CURRENT_APP_VERSION}
                    </p>
                  </div>
                </div>

                {fallbackPrompt ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <p className="text-sm text-center text-muted-foreground px-2">
                      Automatic installation failed. This usually happens if permission was denied. Would you like to download and install the update manually via your browser?
                    </p>
                    <div className="flex flex-col gap-2.5 mt-2">
                      <button
                        onClick={() => {
                          const cacheBustedUrl = `${updateInfo.apkUrl}?t=${Date.now()}`;
                          window.open(cacheBustedUrl, '_blank');
                          onDismiss();
                        }}
                        className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Download Manually
                      </button>
                      <button
                        onClick={onDismiss}
                        className="w-full py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Release notes */}
                    {updateInfo.releaseNotes && (
                      <div className="mb-5 p-3.5 rounded-xl bg-secondary/50 text-sm text-muted-foreground leading-relaxed">
                        {updateInfo.releaseNotes}
                      </div>
                    )}

                    {/* Progress bar */}
                    {downloading && (
                      <div className="mb-5">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                          <span>Downloading update...</span>
                          <span>{Math.round(progress * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2.5">
                      <button
                        id="update-download-btn"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="group flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                      >
                        {downloading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download size={18} />
                            Download & Install
                            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                      {!downloading && (
                        <button
                          id="update-later-btn"
                          onClick={onDismiss}
                          className="w-full py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                        >
                          Remind me later
                        </button>
                      )}
                    </div>
                  </>
                )}

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
