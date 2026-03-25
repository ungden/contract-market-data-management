"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { getCustomers, searchCustomers } from "@/lib/database"
import type { Customer } from "@/lib/types"
import { Search, Plus, X, User } from "lucide-react"
import Link from "next/link"

interface CustomerSelectProps {
  value?: string
  selectedCustomer?: Customer | null
  onSelect: (customer: Customer | null) => void
  placeholder?: string
}

export function CustomerSelect({
  selectedCustomer,
  onSelect,
  placeholder = "Tìm khách hàng theo tên hoặc SĐT...",
}: CustomerSelectProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Customer[]>([])
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent customers on mount
  useEffect(() => {
    getCustomers()
      .then((data) => setRecentCustomers(data.slice(0, 10)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (query.length < 1) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await searchCustomers(query)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const displayList = query.length > 0 ? results : recentCustomers
  const showRecent = query.length === 0 && recentCustomers.length > 0

  if (selectedCustomer) {
    return (
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-muted/30">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedCustomer.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[selectedCustomer.phone, selectedCustomer.address]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
          onClick={() => onSelect(null)}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-[60vh] overflow-y-auto">
            {showRecent && (
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                Khách hàng gần đây
              </div>
            )}

            {searching && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Đang tìm...
              </div>
            )}

            {!searching && query.length > 0 && results.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Không tìm thấy khách hàng
              </div>
            )}

            {!searching &&
              displayList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                  onClick={() => {
                    onSelect(c)
                    setQuery("")
                    setOpen(false)
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[c.phone, c.address].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </button>
              ))}

            <div className="border-t p-2">
              <Link
                href="/customers/new"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                <Plus className="h-4 w-4" />
                Tạo khách hàng mới
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
