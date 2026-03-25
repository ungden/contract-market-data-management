"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCustomers, deleteCustomer } from "@/lib/database"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { Customer } from "@/lib/types"
import { Plus, Search, Trash2, Eye, Download, Upload } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

export default function CustomersPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(labels.messages.deleteConfirm)) return
    try {
      await deleteCustomer(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      toast(labels.messages.deleteSuccess)
    } catch {
      toast(labels.messages.deleteError, "error")
    }
  }

  const handleExport = () => {
    const exportData = filtered.map((c) => ({
      "Tên khách hàng": c.name,
      "Mã số thuế": c.tax_code || "",
      "Số điện thoại": c.phone || "",
      "Người liên hệ": c.contact_person || "",
      "Địa chỉ": c.address || "",
      "Đại diện pháp luật": c.legal_representative || "",
      "Tài khoản NH": c.bank_account || "",
      "Ghi chú": c.notes || "",
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Khách hàng")
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buf]), "khach-hang.xlsx")
    toast(labels.messages.exportSuccess)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws)

        for (const row of rows) {
          const { addCustomer } = await import("@/lib/database")
          await addCustomer({
            name: row["Tên khách hàng"] || row["name"] || "",
            tax_code: row["Mã số thuế"] || row["tax_code"] || null,
            phone: row["Số điện thoại"] || row["phone"] || null,
            contact_person: row["Người liên hệ"] || row["contact_person"] || null,
            address: row["Địa chỉ"] || row["address"] || null,
            legal_representative: row["Đại diện pháp luật"] || null,
            bank_account: row["Tài khoản NH"] || null,
            gps_lat: null,
            gps_lng: null,
            notes: row["Ghi chú"] || null,
            created_by: profile.id,
            creator_name: profile.display_name,
          })
        }
        toast(`${labels.messages.importSuccess}: ${rows.length} khách hàng`)
        loadCustomers()
      } catch {
        toast("Nhập dữ liệu thất bại", "error")
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ""
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.tax_code && c.tax_code.includes(search))
  )

  if (loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{labels.pages.customers}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {labels.buttons.export}
          </Button>
          <Button variant="outline" render={<label className="cursor-pointer" />}>
              <Upload className="mr-2 h-4 w-4" />
              {labels.buttons.import}
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
              />
          </Button>
          <Button render={<Link href="/customers/new" />}>
              <Plus className="mr-2 h-4 w-4" />
              {labels.buttons.add}
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, SĐT, MST..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {labels.messages.noData}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.form.name}</TableHead>
                <TableHead>{labels.form.taxCode}</TableHead>
                <TableHead>{labels.form.phone}</TableHead>
                <TableHead>{labels.form.contactPerson}</TableHead>
                <TableHead>{labels.form.address}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.tax_code || "-"}</TableCell>
                  <TableCell>{c.phone || "-"}</TableCell>
                  <TableCell>{c.contact_person || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {c.address || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" render={<Link href={`/customers/${c.id}`} />}>
                          <Eye className="h-4 w-4" />
                      </Button>
                      {profile?.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
