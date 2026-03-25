"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { formatDate, formatDateTime } from "@/lib/date-utils"
import type { MarketVisit, ProductLine } from "@/lib/types"
import { Plus, Trash2, MapPin, Download, Search, Eye, Clock, User } from "lucide-react"
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
        "Ngày": formatDateTime(v.visit_date),
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
      (v.customer_name && v.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      v.staff_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageLoading />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{labels.pages.marketVisits}</h1>
        <div className="flex gap-2">
          {profile?.role !== "market_staff" && (
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{labels.buttons.export}</span>
            </Button>
          )}
          <Button size="sm" render={<Link href="/market-visits/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            {labels.buttons.add}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên KH, nhân viên..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{labels.messages.noData}</p>
      ) : (
        <>
          {/* Mobile: Card view */}
          <div className="space-y-3 md:hidden">
            {filtered.map((v) => {
              const products = (v.product_lines || []) as ProductLine[]
              return (
                <Link key={v.id} href={`/market-visits/${v.id}`}>
                  <Card className="active:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {v.customer_name || v.shop_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(v.visit_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {v.staff_name}
                            </span>
                          </div>
                          {products.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              SP: {products.map((p) => p.product_name).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {v.gps_lat && v.gps_lng && (
                            <MapPin className="h-4 w-4 text-green-500" />
                          )}
                          {(v.photo_urls as string[] | null)?.length ? (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                              {(v.photo_urls as string[]).length} ảnh
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block rounded-md border">
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
                        {formatDate(v.visit_date)}
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
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
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
        </>
      )}
      <p className="text-xs text-muted-foreground text-right">{filtered.length} lượt viếng thăm</p>
    </div>
  )
}
