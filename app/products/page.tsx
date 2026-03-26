"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/database"
import { productSchema } from "@/lib/schemas"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { Product } from "@/lib/types"
import { Plus, Pencil, Trash2 } from "lucide-react"

export default function ProductsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", origin: "", unit: "" })

  const canManage =
    profile?.role === "admin" || profile?.role === "sale_admin"

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ name: "", origin: "", unit: "" })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!profile) return

    const parsed = productSchema.safeParse(form)
    if (!parsed.success) {
      toast(parsed.error.issues[0].message, "error")
      return
    }

    try {
      if (editingId) {
        await updateProduct(editingId, {
          name: form.name,
          origin: form.origin || null,
          unit: form.unit,
        })
        toast(labels.messages.saveSuccess)
      } else {
        await addProduct({
          name: form.name,
          origin: form.origin || null,
          unit: form.unit,
          created_by: profile.id,
        })
        toast(labels.messages.saveSuccess)
      }
      setDialogOpen(false)
      resetForm()
      loadProducts()
    } catch {
      toast(labels.messages.saveError, "error")
    }
  }

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, origin: p.origin || "", unit: p.unit })
    setEditingId(p.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(labels.messages.deleteConfirm)) return
    try {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast(labels.messages.deleteSuccess)
    } catch {
      toast(labels.messages.deleteError, "error")
    }
  }

  if (!canManage) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{labels.messages.noAccess}</p>
      </div>
    )
  }

  if (loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{labels.pages.products}</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(v) => {
            setDialogOpen(v)
            if (!v) resetForm()
          }}
        >
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            {labels.buttons.add}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>{labels.form.name} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{labels.form.origin}</Label>
                <Input
                  value={form.origin}
                  onChange={(e) =>
                    setForm({ ...form, origin: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{labels.form.unit} *</Label>
                <Input
                  value={form.unit}
                  onChange={(e) =>
                    setForm({ ...form, unit: e.target.value })
                  }
                  placeholder="kg, tấn, thùng..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {labels.buttons.save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {labels.messages.noData}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.form.name}</TableHead>
                <TableHead>{labels.form.origin}</TableHead>
                <TableHead>{labels.form.unit}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.origin || "-"}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
