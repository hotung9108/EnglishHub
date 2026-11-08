import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (item: Omit<ToastItem, 'id'>) => string;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    ({ type, message, title, duration = 4000 }: Omit<ToastItem, 'id'>): string => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newItem: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newItem]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast({ type: 'success', message, title, duration }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast({ type: 'error', message, title, duration }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast({ type: 'warning', message, title, duration }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast({ type: 'info', message, title, duration }),
    [showToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
      clearAll,
    }),
    [showToast, success, error, warning, info, removeToast, clearAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="eh-toast-container"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100vw - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const config = {
            success: {
              icon: <CheckCircle2 size={18} color="#17523F" />,
              bg: '#FAF8F5',
              border: '#B7DEC8',
              badgeColor: '#17523F',
              accentLine: '#17523F',
            },
            error: {
              icon: <AlertCircle size={18} color="#8F2222" />,
              bg: '#FAF8F5',
              border: '#F3C5C5',
              badgeColor: '#8F2222',
              accentLine: '#8F2222',
            },
            warning: {
              icon: <AlertTriangle size={18} color="#8C5E14" />,
              bg: '#FAF8F5',
              border: '#ECD8B0',
              badgeColor: '#8C5E14',
              accentLine: '#8C5E14',
            },
            info: {
              icon: <Info size={18} color="#1B4D3E" />,
              bg: '#FAF8F5',
              border: '#C2D9C5',
              badgeColor: '#1B4D3E',
              accentLine: '#1B4D3E',
            },
          }[t.type];

          return (
            <div
              key={t.id}
              role="alert"
              className="eh-toast-item"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                background: config.bg,
                border: `1px solid ${config.border}`,
                borderLeft: `4px solid ${config.accentLine}`,
                borderRadius: '8px',
                boxShadow: '0 8px 24px -4px rgba(38, 35, 32, 0.12), 0 2px 6px rgba(38, 35, 32, 0.04)',
                fontFamily: "var(--eh-font-sans, 'Plus Jakarta Sans', sans-serif)",
                animation: 'ehToastSlideIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>{config.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: '#262320',
                      marginBottom: '2px',
                      fontFamily: "var(--eh-font-serif, 'Lora', serif)",
                    }}
                  >
                    {t.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '13px',
                    color: '#736B63',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                  }}
                >
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: '#968E85',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#262320')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#968E85')}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback for non-provider contexts or tests
    return {
      showToast: () => '',
      success: (msg: string) => { console.log('[Toast success]', msg); return ''; },
      error: (msg: string) => { console.error('[Toast error]', msg); return ''; },
      warning: (msg: string) => { console.warn('[Toast warning]', msg); return ''; },
      info: (msg: string) => { console.info('[Toast info]', msg); return ''; },
      removeToast: () => {},
      clearAll: () => {},
    };
  }
  return context;
};
