"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextType>({
  toast: () => {},
})

export function useToast() {
  return React.useContext(ToastContext)
}

const DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 5000,
  error: 8000,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => removeToast(id), DURATIONS[type])
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 md:left-auto md:right-4 md:translate-x-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg animate-in slide-in-from-bottom-2 fade-in-0 min-w-[280px] max-w-[90vw] md:max-w-[400px]",
              t.type === "success" && "bg-green-600 text-white",
              t.type === "error" && "bg-red-600 text-white",
              t.type === "info" && "bg-primary text-primary-foreground"
            )}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-full p-0.5 hover:bg-white/20 transition-colors"
              aria-label="Đóng"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
