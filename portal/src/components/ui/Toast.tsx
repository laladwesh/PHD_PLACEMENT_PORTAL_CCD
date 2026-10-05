'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  toast: {
    success: (msg: string, duration?: number) => void;
    error: (msg: string, duration?: number) => void;
    info: (msg: string, duration?: number) => void;
    warning: (msg: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Standalone global function that works anywhere in client code
 */
export function triggerGlobalToast(message: string, type: ToastType = 'success', duration = 3500) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('portal_toast_event', {
        detail: { message, type, duration },
      })
    );
  }
}

export const toast = {
  success: (msg: string, duration = 3500) => triggerGlobalToast(msg, 'success', duration),
  error: (msg: string, duration = 4000) => triggerGlobalToast(msg, 'error', duration),
  info: (msg: string, duration = 3500) => triggerGlobalToast(msg, 'info', duration),
  warning: (msg: string, duration = 3500) => triggerGlobalToast(msg, 'warning', duration),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, message, type };

      setToasts((prev) => [...prev.slice(-2), newToast]); // keep at most 3

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: ToastType; duration?: number }>;
      if (customEvent.detail?.message) {
        showToast(
          customEvent.detail.message,
          customEvent.detail.type || 'success',
          customEvent.detail.duration || 3500
        );
      }
    };

    window.addEventListener('portal_toast_event', handleCustomToast);
    return () => window.removeEventListener('portal_toast_event', handleCustomToast);
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    toast: {
      success: (msg, dur) => showToast(msg, 'success', dur),
      error: (msg, dur) => showToast(msg, 'error', dur),
      info: (msg, dur) => showToast(msg, 'info', dur),
      warning: (msg, dur) => showToast(msg, 'warning', dur),
    },
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-4 h-4 text-[#1B2A4A] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-auto max-w-[90vw]">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-center gap-2.5 bg-white border border-gray-200 rounded-full px-5 py-2 shadow-md transition-all animate-in fade-in slide-in-from-top-2"
          >
            {getIcon(item.type)}
            <span className="text-xs sm:text-sm font-medium text-gray-800 whitespace-nowrap">
              {item.message}
            </span>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-gray-400 hover:text-gray-700 ml-1 text-sm font-bold leading-none p-0.5"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: triggerGlobalToast,
      toast,
    };
  }
  return context;
}
