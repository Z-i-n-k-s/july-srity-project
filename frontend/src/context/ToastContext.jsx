import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { makeId } from "../lib/utils";

const ToastContext = createContext(null);
const icons = { success: CheckCircle2, error: XCircle, warning: TriangleAlert, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const push = useCallback((message, type = "info", duration = 4200) => {
    const id = makeId("toast");
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);
  const value = useMemo(() => ({
    toast: push,
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
    warning: (message) => push(message, "warning"),
    info: (message) => push(message, "info"),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-24 z-[130] flex w-[min(92vw,380px)] flex-col gap-3" aria-live="polite">
        <AnimatePresence>
          {toasts.map((item) => {
            const Icon = icons[item.type] || Info;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: 30, scale: .98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20 }} className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink-800/95 p-4 shadow-2xl backdrop-blur-xl">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-archive-amber" aria-hidden="true" />
                <p className="flex-1 text-sm leading-6 text-archive-paper">{item.message}</p>
                <button onClick={() => dismiss(item.id)} aria-label="Dismiss notification" className="focus-ring rounded-md p-1 text-archive-muted hover:text-white"><X className="h-4 w-4" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
