"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info" | "milestone";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  milestone: (message: string) => void;
};

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Styling ──────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-mint/40 bg-mint/10 text-ink",
  error: "border-flare/40 bg-flare/10 text-flare",
  info: "border-ink/20 bg-chalk text-ink",
  milestone: "border-amber-400/40 bg-amber-50 text-amber-900",
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  milestone: "★",
};

// ── Provider ─────────────────────────────────────────────────────────────────

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `toast-${++counter}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    toast: push,
    success: useCallback((m: string) => push(m, "success"), [push]),
    error: useCallback((m: string) => push(m, "error"), [push]),
    info: useCallback((m: string) => push(m, "info"), [push]),
    milestone: useCallback((m: string) => push(m, "milestone"), [push]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300",
              VARIANT_STYLES[t.variant],
              t.exiting
                ? "translate-x-4 opacity-0"
                : "translate-x-0 opacity-100 animate-in slide-in-from-right-4",
            )}
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-bold">
              {VARIANT_ICONS[t.variant]}
            </span>
            <p className="text-sm font-semibold leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="ml-auto shrink-0 text-xs opacity-50 hover:opacity-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
