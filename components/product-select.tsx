"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProducts } from "@/lib/database"
import type { Product } from "@/lib/types"

interface ProductSelectProps {
  value?: string
  onSelect: (product: {
    product_id: string
    product_name: string
    unit: string
  }) => void
  placeholder?: string
}

export function ProductSelect({
  value,
  onSelect,
  placeholder = "Chọn sản phẩm",
}: ProductSelectProps) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => {})
  }, [])

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        const p = products.find((p) => p.id === val)
        if (p) {
          onSelect({
            product_id: p.id,
            product_name: p.name,
            unit: p.unit,
          })
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {products.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name} ({p.unit})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
