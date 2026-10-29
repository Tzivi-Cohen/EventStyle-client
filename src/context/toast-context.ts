import { createContext } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export type ToastContextValue = {
  show: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
