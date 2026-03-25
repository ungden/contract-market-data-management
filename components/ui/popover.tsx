"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextType>({
  open: false,
  setOpen: () => {},
})

function Popover({ children, open: controlledOpen, onOpenChange }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(e) => {
        setOpen(!open)
        onClick?.(e)
      }}
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end"; sideOffset?: number }
>(({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.closest('.relative')?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
