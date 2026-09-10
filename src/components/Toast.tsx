import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts?: ToastMessage[];
  onDismiss?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts: propToasts,
  onDismiss: propOnDismiss,
}) => {
  const [internalToasts, setInternalToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ title?: string; message: string; type?: 'success' | 'error' | 'warning' | 'info' }>;
      if (customEvent.detail) {
        const newToast: ToastMessage = {
          id: String(Date.now() + Math.random()),
          title: customEvent.detail.title || (customEvent.detail.type === 'error' ? 'Error' : 'Notification'),
          message: customEvent.detail.message,
          type: customEvent.detail.type || 'info',
        };
        setInternalToasts((prev) => [...prev, newToast]);

        // Auto dismiss after 4 seconds
        setTimeout(() => {
          setInternalToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 4000);
      }
    };

    window.addEventListener('app-toast', handleToastEvent);
    return () => window.removeEventListener('app-toast', handleToastEvent);
  }, []);

  const activeToasts = propToasts || internalToasts;
  if (!activeToasts || activeToasts.length === 0) return null;

  const handleDismiss = (id: string) => {
    if (propOnDismiss) {
      propOnDismiss(id);
    } else {
      setInternalToasts((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {activeToasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : isError
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <XCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 text-xs space-y-0.5">
              <p className="font-bold leading-tight">{toast.title}</p>
              {toast.message && <p className="opacity-90 leading-normal">{toast.message}</p>}
            </div>

            <button
              onClick={() => handleDismiss(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Helper utility to show global toasts from anywhere in the app
export function showAppToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string) {
  window.dispatchEvent(
    new CustomEvent('app-toast', {
      detail: { title, message, type },
    })
  );
}
