"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getMarketVisitsByDate, getUsers } from "@/lib/database"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { MarketVisit, UserProfile, ProductLine } from "@/lib/types"
import { Download, MapPin } from "lucide-react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

export default function ReportsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [staffId, setStaffId] = useState<string>("all")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [visits, setVisits] = useState<MarketVisit[]>([])
  const [loading, setLoading] = useState(false)

  const isAdmin = profile?.role === "admin" || profile?.role === "sale_admin"

  useEffect(() => {
    if (isAdmin) {
      getUsers().then(setUsers).catch(() => {})
    }
  }, [isAdmin])

  useEffect(() => {
    loadReport()
  }, [date, staffId])

  const loadReport = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const sid =
        staffId === "all"
          ? isAdmin
            ? undefined
            : profile.id
          : staffId
      const data = await getMarketVisitsByDate(date, sid)
      setVisits(data)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const exportData = visits.map((v) => {
      const products = (v.product_lines || []) as ProductLine[]
      return {
        "Thời gian": new Date(v.visit_date).toLocaleTimeString("vi-VN"),
        "Nhân viên": v.staff_name,
        "Khách hàng": v.customer_name || v.shop_name,
        "Khu vực": v.area || "",
        "Sản phẩm": products.map((p) => p.product_name).join(", "),
        "Sản lượng": products
          .map((p) => `${p.product_name}: ${p.daily_output || 0}`)
          .join("; "),
        "Giá": products
          .map((p) => `${p.product_name}: ${p.price || 0}`)
          .join("; "),
        "GPS":
          v.gps_lat && v.gps_lng
            ? `${v.gps_lat}, ${v.gps_lng}`
            : "",
      }
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo ngày")
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buf]), `bao-cao-${date}.xlsx`)
    toast(labels.messages.exportSuccess)
  }

  // Calculate time between visits
  const visitTimes = visits.map((v) => new Date(v.visit_date).getTime())
  const avgTimeBetween =
    visitTimes.length > 1
      ? (visitTimes[visitTimes.length - 1] - visitTimes[0]) /
        (visitTimes.length - 1) /
        60000
      : 0

  if (!isAdmin && profile?.role !== "market_staff") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{labels.messages.noAccess}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{labels.pages.reports}</h1>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={visits.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          {labels.buttons.export}
        </Button>
      </div>

      <div className="flex gap-4">
        <div>
          <Label>Chọn ngày</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        {isAdmin && (
          <div>
            <Label>{labels.form.staffName}</Label>
            <Select value={staffId} onValueChange={(v) => v && setStaffId(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tất cả nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Số điểm đã đi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Thời gian TB giữa các điểm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgTimeBetween > 0
                ? `${Math.round(avgTimeBetween)} phút`
                : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Check-in đầu / cuối
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {visits.length > 0 ? (
                <>
                  {new Date(visits[0].visit_date).toLocaleTimeString(
                    "vi-VN",
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                  {" - "}
                  {new Date(
                    visits[visits.length - 1].visit_date
                  ).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              ) : (
                "-"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      {loading ? (
        <PageLoading text="Đang tải báo cáo..." />
      ) : visits.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Không có dữ liệu viếng thăm cho ngày này
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>{labels.form.staffName}</TableHead>
                <TableHead>{labels.form.customer}</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>{labels.form.dailyOutput}</TableHead>
                <TableHead>{labels.form.price}</TableHead>
                <TableHead>GPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((v) => {
                const products = (v.product_lines || []) as ProductLine[]
                return (
                  <TableRow key={v.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(v.visit_date).toLocaleTimeString(
                        "vi-VN",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </TableCell>
                    <TableCell>{v.staff_name}</TableCell>
                    <TableCell className="font-medium">
                      {v.customer_name || v.shop_name}
                    </TableCell>
                    <TableCell>
                      {products.map((p) => p.product_name).join(", ") ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {products
                        .map(
                          (p) =>
                            p.daily_output?.toLocaleString("vi-VN") || "-"
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      {products
                        .map(
                          (p) => p.price?.toLocaleString("vi-VN") || "-"
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      {v.gps_lat && v.gps_lng ? (
                        <a
                          href={`https://maps.google.com/?q=${v.gps_lat},${v.gps_lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPin className="h-4 w-4 text-primary" />
                        </a>
                      ) : (
                        "-"
                      )}
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
