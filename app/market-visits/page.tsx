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
import { getMarketVisits, deleteMarketVisit } from "@/lib/database"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { MarketVisit, ProductLine } from "@/lib/types"
import { Plus, Trash2, MapPin, Download, Search, Eye } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

export default function MarketVisitsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [visits, setVisits] = useState<MarketVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadVisits()
  }, [])

  const loadVisits = async () => {
    try {
      const data = await getMarketVisits()
      setVisits(data)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(labels.messages.deleteConfirm)) return
    try {
      await deleteMarketVisit(id)
      setVisits((prev) => prev.filter((v) => v.id !== id))
      toast(labels.messages.deleteSuccess)
    } catch {
      toast(labels.messages.deleteError, "error")
    }
  }

  const handleExport = () => {
    const exportData = filtered.map((v) => {
      const products = (v.product_lines || []) as ProductLine[]
      return {
        "Ngày": new Date(v.visit_date).toLocaleDateString("vi-VN"),
        "Nhân viên": v.staff_name,
        "Khách hàng": v.customer_name || v.shop_name,
        "Khu vực": v.area || "",
        "Địa chỉ": v.address || "",
        "Liên hệ": v.contact_person || "",
        "Sản phẩm": products.map((p) => p.product_name).join(", "),
        "Ghi chú": v.notes || "",
        "GPS": v.gps_lat && v.gps_lng ? `${v.gps_lat}, ${v.gps_lng}` : "",
      }
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Viếng thăm")
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buf]), "vieng-tham.xlsx")
    toast(labels.messages.exportSuccess)
  }

  const filtered = visits.filter(
    (v) =>
      v.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      (v.customer_name &&
        v.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      v.staff_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{labels.pages.marketVisits}</h1>
        <div className="flex gap-2">
          {profile?.role !== "market_staff" && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filtered.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {labels.buttons.export}
            </Button>
          )}
          <Button render={<Link href="/market-visits/new" />}>
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
          placeholder="Tìm theo tên KH, nhân viên..."
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
                <TableHead>{labels.form.visitDate}</TableHead>
                <TableHead>{labels.form.staffName}</TableHead>
                <TableHead>{labels.form.customer}</TableHead>
                <TableHead>{labels.form.area}</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>{labels.form.notes}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => {
                const products = (v.product_lines || []) as ProductLine[]
                return (
                  <TableRow key={v.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(v.visit_date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>{v.staff_name}</TableCell>
                    <TableCell className="font-medium">
                      {v.customer_name || v.shop_name}
                    </TableCell>
                    <TableCell>{v.area || "-"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {products.length > 0
                        ? products.map((p) => p.product_name).join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {v.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" render={<Link href={`/market-visits/${v.id}`} />}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        {v.gps_lat && v.gps_lng && (
                          <a
                            href={`https://maps.google.com/?q=${v.gps_lat},${v.gps_lng}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button variant="ghost" size="icon">
                              <MapPin className="h-4 w-4 text-indigo-500" />
                            </Button>
                          </a>
                        )}
                        {profile?.role === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(v.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
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
