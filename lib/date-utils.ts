import { format } from "date-fns"
import { vi } from "date-fns/locale"

export function formatDate(date: string | Date, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, pattern, { locale: vi })
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy HH:mm")
}

export function formatTime(date: string | Date): string {
  return formatDate(date, "HH:mm")
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, "dd/MM")
}
