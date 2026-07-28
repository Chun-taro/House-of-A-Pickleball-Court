import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const CONFIGS = {
  success: {
    Icon: CheckCircle2,
    border: '#10b981',
    iconColor: '#059669',
    titleColor: '#064e3b',
    title: 'Success',
  },
  error: {
    Icon: XCircle,
    border: '#f43f5e',
    iconColor: '#e11d48',
    titleColor: '#881337',
    title: 'Error',
  },
  warning: {
    Icon: AlertTriangle,
    border: '#f59e0b',
    iconColor: '#d97706',
    titleColor: '#78350f',
    title: 'Warning',
  },
  info: {
    Icon: Info,
    border: '#38bdf8',
    iconColor: '#0284c7',
    titleColor: '#0c4a6e',
    title: 'Info',
  },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = CONFIGS[toast.type] || CONFIGS.info;
  const { Icon } = cfg;

  return (
    <div
      className="toast-item flex items-start gap-3 bg-white rounded-2xl shadow-2xl p-4 w-80 max-w-[calc(100vw-2rem)]"
      style={{ borderLeft: `4px solid ${cfg.border}` }}
    >
      <Icon style={{ color: cfg.iconColor }} className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold" style={{ color: cfg.titleColor }}>{cfg.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 text-slate-300 hover:text-slate-500 rounded-lg transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return {
    success: (msg, duration) => ctx.showToast('success', msg, duration),
    error: (msg, duration) => ctx.showToast('error', msg, duration),
    warning: (msg, duration) => ctx.showToast('warning', msg, duration),
    info: (msg, duration) => ctx.showToast('info', msg, duration),
  };
}
