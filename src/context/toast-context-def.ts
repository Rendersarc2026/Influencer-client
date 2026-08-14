import { createContext } from 'react';

export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

export interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
