import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

const TYPE_STYLES = {
  danger: {
    iconBg: '#fff1f2',
    iconColor: '#e11d48',
    Icon: Trash2,
    confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-200',
  },
  warning: {
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    Icon: AlertTriangle,
    confirmClass: 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-200',
  },
  info: {
    iconBg: '#f0fdf4',
    iconColor: '#059669',
    Icon: HelpCircle,
    confirmClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-200',
  },
};

function ConfirmModal({ options, onConfirm, onCancel }) {
  const {
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
  } = options;

  const styles = TYPE_STYLES[type] || TYPE_STYLES.danger;
  const { Icon } = styles;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="confirm-modal bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-500 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: styles.iconBg }}
          >
            <Icon style={{ color: styles.iconColor }} className="w-8 h-8" />
          </div>

          {/* Text */}
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${styles.confirmClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <ConfirmModal
          options={state.options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}
