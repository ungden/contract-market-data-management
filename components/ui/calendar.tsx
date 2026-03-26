"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
]

function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [viewDate, setViewDate] = React.useState(selected ?? new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const isSelected = (day: number) =>
    selected &&
    selected.getDate() === day &&
    selected.getMonth() === month &&
    selected.getFullYear() === year

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    )
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {MONTHS[month]} {year}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
        {days.map((day, i) => (
          <div key={i} className="aspect-square">
            {day && (
              <button
                type="button"
                onClick={() => onSelect?.(new Date(year, month, day))}
                className={cn(
                  "h-full w-full rounded-md text-sm hover:bg-accent",
                  isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary",
                  isToday(day) && !isSelected(day) && "bg-accent font-bold"
                )}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Calendar }
