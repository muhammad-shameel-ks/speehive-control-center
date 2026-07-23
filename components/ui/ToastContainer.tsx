"use client";

import { useEffect, useState } from "react";
import { CheckIcon, XIcon, SparklesIcon } from "@/components/icons";

export type ToastMessage = {
  id: string;
  type?: "success" | "error" | "info";
  title: string;
  description?: string;
};

type ToastListener = (toast: ToastMessage) => void;
const listeners = new Set<ToastListener>();

export function showToast(toast: Omit<ToastMessage, "id">) {
  const fullToast: ToastMessage = {
    ...toast,
    id: Math.random().toString(36).substring(2, 9),
  };
  listeners.forEach((listener) => listener(fullToast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev.slice(-4), newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === "error" ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                <XIcon className="h-3.5 w-3.5" />
              </div>
            ) : toast.type === "info" ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-sky-500">
                <SparklesIcon className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                <CheckIcon className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-semibold text-foreground leading-tight">
              {toast.title}
            </h4>
            {toast.description && (
              <p className="mt-1 text-[11px] text-muted-foreground leading-normal line-clamp-2">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
            aria-label="Dismiss toast"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
