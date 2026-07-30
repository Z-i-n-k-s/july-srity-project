import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import useScrollLock from "../../hooks/useScrollLock";
import { cn } from "../../lib/utils";

export default function Modal({ open, onClose, title, description, children, size = "md" }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (event) => event.key === "Escape" && onCloseRef.current?.();
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
      previous?.focus?.();
    };
  }, [open]);

  const widths = { sm: "max-w-lg", md: "max-w-2xl", lg: "max-w-4xl" };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={cn("max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 shadow-2xl sm:rounded-2xl", widths[size])}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-ink-900/95 px-5 py-4 backdrop-blur-xl sm:px-6">
              <div>
                <h2 id="modal-title" className="font-display text-2xl font-semibold text-archive-paper">{title}</h2>
                {description && <p className="mt-1 text-sm leading-6 text-archive-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} className="focus-ring rounded-lg p-2 text-archive-muted hover:bg-white/5 hover:text-white" aria-label="Close dialog">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
