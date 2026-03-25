"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"
import { labels } from "@/lib/i18n"
import { Download, Database } from "lucide-react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

const TABLES = [
  { name: "users", label: "Người dùng" },
  { name: "customers", label: "Khách hàng" },
  { name: "products", label: "Sản phẩm" },
  { name: "contract_templates", label: "Mẫu hợp đồng" },
  { name: "contracts", label: "Hợp đồng" },
  { name: "market_visits", label: "Viếng thăm" },
]

export default function BackupPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)

  if (profile?.role !== "admin") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{labels.messages.noAccess}</p>
      </div>
    )
  }

  const handleExportAll = async () => {
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()

      for (const table of TABLES) {
        const { data, error } = await supabase
          .from(table.name)
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error(`Error exporting ${table.name}:`, error)
          continue
        }

        const ws = XLSX.utils.json_to_sheet(data || [])
        XLSX.utils.book_append_sheet(wb, ws, table.label)
      }

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const date = new Date().toISOString().split("T")[0]
      saveAs(new Blob([buf]), `backup-${date}.xlsx`)
      toast(labels.messages.exportSuccess)
    } catch {
      toast("Xuất dữ liệu thất bại", "error")
    } finally {
      setExporting(false)
    }
  }

  const handleExportTable = async (tableName: string, tableLabel: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      const ws = XLSX.utils.json_to_sheet(data || [])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, tableLabel)
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      saveAs(new Blob([buf]), `${tableName}.xlsx`)
      toast(labels.messages.exportSuccess)
    } catch {
      toast("Xuất dữ liệu thất bại", "error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{labels.pages.backup}</h1>
        <Button onClick={handleExportAll} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Đang xuất..." : "Xuất toàn bộ"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TABLES.map((table) => (
          <Card key={table.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {table.label}
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Bảng: {table.name}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleExportTable(table.name, table.label)
                }
              >
                <Download className="mr-2 h-3 w-3" />
                Xuất Excel
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
