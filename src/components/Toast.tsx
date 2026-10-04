import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border animate-in slide-in-from-bottom-3 duration-200 min-w-[300px] max-w-md ${
              isSuccess
                ? 'bg-surface-container-lowest border-secondary text-on-surface'
                : isError
                ? 'bg-surface-container-lowest border-error text-on-surface'
                : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
                isSuccess ? 'text-secondary' : isError ? 'text-error' : 'text-primary'
              }`}
            >
              {isSuccess ? 'check_circle' : isError ? 'error' : 'info'}
            </span>

            <div className="flex-1">
              <p className="font-label-md text-label-md font-bold leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
