import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let Icon = CheckCircle2;
        let colorClasses = 'border-emerald-500/30 bg-[#161b22]/95 text-emerald-300 shadow-xl';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          colorClasses = 'border-rose-500/30 bg-[#161b22]/95 text-rose-300 shadow-xl';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          colorClasses = 'border-amber-500/30 bg-[#161b22]/95 text-amber-300 shadow-xl';
        } else if (toast.type === 'info') {
          Icon = Info;
          colorClasses = 'border-indigo-500/30 bg-[#161b22]/95 text-indigo-300 shadow-xl';
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-lg border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${colorClasses}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{toast.message}</p>
              )}
            </div>
            <button
              id={`toast-dismiss-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
