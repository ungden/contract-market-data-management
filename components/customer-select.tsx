"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchCustomers } from "@/lib/database"
import type { Customer } from "@/lib/types"
import { Search, Plus, X } from "lucide-react"
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
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)

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

  if (selectedCustomer) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-3 py-2">
        <div className="flex-1">
          <p className="text-sm font-medium">{selectedCustomer.name}</p>
          {selectedCustomer.phone && (
            <p className="text-xs text-muted-foreground">
              {selectedCustomer.phone}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onSelect(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {open && (query.length > 0 || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {searching && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Đang tìm...
            </div>
          )}
          {!searching && results.length === 0 && query.length > 0 && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Không tìm thấy khách hàng
            </div>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                onSelect(c)
                setQuery("")
                setOpen(false)
              }}
            >
              <div className="flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[c.phone, c.address].filter(Boolean).join(" - ")}
                </p>
              </div>
            </button>
          ))}
          <div className="border-t p-2">
            <Link
              href="/customers/new"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
              Tạo khách hàng mới
            </Link>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
