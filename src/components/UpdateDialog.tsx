import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, ArrowRight } from 'lucide-react';
import type { UpdateInfo } from '../hooks/useAppUpdater';
import { CURRENT_APP_VERSION } from '../hooks/useAppUpdater';

interface UpdateDialogProps {
  updateInfo: UpdateInfo | null;
  onDismiss: () => void;
}

export default function UpdateDialog({ updateInfo, onDismiss }: UpdateDialogProps) {
  if (!updateInfo) return null;

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
            onClick={onDismiss}
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
                  className="absolute top-5 right-5 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
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

                {/* Release notes */}
                {updateInfo.releaseNotes && (
                  <div className="mb-5 p-3.5 rounded-xl bg-secondary/50 text-sm text-muted-foreground leading-relaxed">
                    {updateInfo.releaseNotes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  <a
                    id="update-download-btn"
                    href={updateInfo.apkUrl}
                    download
                    onClick={onDismiss}
                    className="group flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download size={18} />
                    Download & Install
                    <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </a>
                  <button
                    id="update-later-btn"
                    onClick={onDismiss}
                    className="w-full py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                  >
                    Remind me later
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
