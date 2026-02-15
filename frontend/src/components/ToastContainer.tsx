import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import type { ToastType } from '../store/toastStore';

const ICON_MAP: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLE_MAP: Record<ToastType, string> = {
  success: 'bg-white border-green-200 text-green-800 dark:bg-slate-800 dark:border-green-700 dark:text-green-300',
  error: 'bg-white border-red-200 text-red-800 dark:bg-slate-800 dark:border-red-700 dark:text-red-300',
  info: 'bg-white border-blue-200 text-blue-800 dark:bg-slate-800 dark:border-blue-700 dark:text-blue-300',
};

const ICON_STYLE_MAP: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICON_MAP[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 px-4 py-3 border rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-black/30 animate-[slideIn_0.2s_ease-out] ${STYLE_MAP[toast.type]}`}
            role="alert"
            data-testid="toast"
          >
            <Icon size={16} className={`flex-shrink-0 mt-0.5 ${ICON_STYLE_MAP[toast.type]}`} />
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 opacity-40 hover:opacity-100 transition-opacity"
              aria-label="閉じる"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
