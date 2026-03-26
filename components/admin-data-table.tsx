"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Pencil, Plus, Search, Loader2 } from "lucide-react"

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  editable?: boolean
  type?: "text" | "number" | "textarea" | "select" | "date"
  options?: { value: string; label: string }[]
  width?: string
}

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  onAdd?: (item: Record<string, unknown>) => Promise<void>
  onEdit?: (id: string, updates: Record<string, unknown>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  addFields?: {
    key: string
    label: string
    type?: "text" | "number" | "textarea" | "select" | "date"
    options?: { value: string; label: string }[]
    required?: boolean
    defaultValue?: string
  }[]
  title?: string
  searchable?: boolean
  searchKeys?: string[]
}

export function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  addFields,
  title,
  searchable = true,
  searchKeys = [],
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = searchable && search
    ? data.filter((item) => {
        const record = item as unknown as Record<string, unknown>
        return searchKeys.some((key) => {
          const val = record[key]
          return val && String(val).toLowerCase().includes(search.toLowerCase())
        })
      })
    : data

  const handleAdd = async () => {
    if (!onAdd) return
    setSaving(true)
    try {
      await onAdd(formData)
      setAddOpen(false)
      setFormData({})
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!onEdit || !editingItem) return
    setSaving(true)
    try {
      await onEdit(editingItem.id, formData)
      setEditOpen(false)
      setEditingItem(null)
      setFormData({})
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!onDelete || !confirm("Xác nhận xóa?")) return
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const openEdit = (item: T) => {
    setEditingItem(item)
    const record = item as unknown as Record<string, unknown>
    const initial: Record<string, unknown> = {}
    columns.forEach((col) => {
      if (col.editable) initial[col.key] = record[col.key] ?? ""
    })
    setFormData(initial)
    setEditOpen(true)
  }

  const openAdd = () => {
    const initial: Record<string, unknown> = {}
    addFields?.forEach((f) => {
      initial[f.key] = f.defaultValue ?? ""
    })
    setFormData(initial)
    setAddOpen(true)
  }

  const renderField = (
    key: string,
    type: string = "text",
    options?: { value: string; label: string }[]
  ) => {
    const value = formData[key] ?? ""
    if (type === "textarea") {
      return (
        <Textarea
          value={String(value)}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          rows={3}
        />
      )
    }
    if (type === "select" && options) {
      return (
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={String(value)}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        >
          <option value="">-- Chọn --</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    }
    return (
      <Input
        type={type === "number" ? "number" : type === "date" ? "date" : "text"}
        value={String(value)}
        onChange={(e) =>
          setFormData({
            ...formData,
            [key]: type === "number" ? Number(e.target.value) || "" : e.target.value,
          })
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {searchable && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="pl-9 h-9"
            />
          </div>
        )}
        {onAdd && addFields && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Thêm
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} / {data.length} bản ghi
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left font-medium text-muted-foreground"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-3 py-2 text-right font-medium text-muted-foreground w-[80px]">
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const record = item as unknown as Record<string, unknown>
                return (
                  <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2">
                        {col.render
                          ? col.render(item)
                          : String(record[col.key] ?? "-")}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {onEdit && (
                            <button
                              onClick={() => openEdit(item)}
                              className="rounded p-1 hover:bg-muted transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="rounded p-1 hover:bg-destructive/10 transition-colors"
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {addFields?.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </label>
                {renderField(f.key, f.type, f.options)}
              </div>
            ))}
            <Button onClick={handleAdd} disabled={saving} className="w-full">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang lưu...</>
              ) : (
                "Lưu"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {columns
              .filter((col) => col.editable)
              .map((col) => (
                <div key={col.key}>
                  <label className="text-sm font-medium">{col.label}</label>
                  {renderField(col.key, col.type, col.options)}
                </div>
              ))}
            <Button onClick={handleEdit} disabled={saving} className="w-full">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang lưu...</>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
