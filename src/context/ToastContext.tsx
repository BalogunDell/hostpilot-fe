import { CheckCircle2, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Typography } from '../components'
import { cn } from '../lib/cn'

type ToastVariant = 'success' | 'error'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, message, variant }])
      window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-4 top-4 z-[9999] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:right-6 sm:items-end"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full min-h-16 max-w-lg items-center gap-4 rounded-xl border px-5 py-4 shadow-xl sm:min-w-[22rem]',
                toast.variant === 'success'
                  ? 'border-tertiary bg-tertiary-50'
                  : 'border-destructive bg-destructive-50',
              )}
              role="status"
            >
              <CheckCircle2
                className={cn(
                  'size-7 shrink-0',
                  toast.variant === 'success' ? 'text-tertiary' : 'text-destructive',
                )}
              />
              <Typography variant="body" className="flex-1 font-medium">
                {toast.message}
              </Typography>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => dismissToast(toast.id)}
              >
                <X className="size-5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
