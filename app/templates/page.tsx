"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { getTemplates, addTemplate, deleteTemplate } from "@/lib/database"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { ContractTemplate, TemplateField } from "@/lib/types"
import { Plus, Trash2 } from "lucide-react"

export default function TemplatesPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [fields, setFields] = useState<TemplateField[]>([
    { name: "", label: "", type: "text" },
  ])

  const canManage =
    profile?.role === "admin" || profile?.role === "sale_admin"

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setType("")
    setDescription("")
    setFields([{ name: "", label: "", type: "text" }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      await addTemplate({
        name,
        type,
        description: description || null,
        fields_json: JSON.stringify(fields),
        created_by: profile.id,
      })
      toast(labels.messages.saveSuccess)
      setOpen(false)
      resetForm()
      loadTemplates()
    } catch {
      toast(labels.messages.saveError, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(labels.messages.deleteConfirm)) return
    try {
      await deleteTemplate(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
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
        <h1 className="text-2xl font-bold">{labels.pages.templates}</h1>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) resetForm()
          }}
        >
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            {labels.buttons.add}
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo mẫu hợp đồng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Tên mẫu *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Loại tài liệu *</Label>
                  <Input
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="VD: Hợp đồng mua bán, Báo giá"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>{labels.form.description}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Các trường dữ liệu</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFields([
                        ...fields,
                        { name: "", label: "", type: "text" },
                      ])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm trường
                  </Button>
                </div>
                {fields.map((field, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>Key</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => {
                          const f = [...fields]
                          f[i].name = e.target.value
                          setFields(f)
                        }}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Nhãn</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          const f = [...fields]
                          f[i].label = e.target.value
                          setFields(f)
                        }}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Kiểu</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={field.type}
                        onChange={(e) => {
                          const f = [...fields]
                          f[i].type = e.target
                            .value as TemplateField["type"]
                          setFields(f)
                        }}
                      >
                        <option value="text">Văn bản</option>
                        <option value="number">Số</option>
                        <option value="date">Ngày</option>
                        <option value="textarea">Văn bản dài</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setFields(fields.filter((_, j) => j !== i))
                      }
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Đang lưu..." : labels.buttons.save}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {labels.messages.noData}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.form.name}</TableHead>
                <TableHead>{labels.form.type}</TableHead>
                <TableHead>{labels.form.description}</TableHead>
                <TableHead>Số trường</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => {
                const fieldsCount = JSON.parse(
                  t.fields_json || "[]"
                ).length
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{t.description || "-"}</TableCell>
                    <TableCell>{fieldsCount}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
