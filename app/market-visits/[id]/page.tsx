"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getMarketVisit } from "@/lib/database"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { MarketVisit, ProductLine } from "@/lib/types"
import { ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"

export default function MarketVisitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [visit, setVisit] = useState<MarketVisit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVisit()
  }, [id])

  const loadVisit = async () => {
    try {
      const data = await getMarketVisit(id)
      setVisit(data)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoading />
  if (!visit) return <p className="p-8 text-center">{labels.messages.noData}</p>

  const products = (visit.product_lines || []) as ProductLine[]
  const photos = (visit.photo_urls || []) as string[]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/market-visits" />}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {visit.customer_name || visit.shop_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(visit.visit_date).toLocaleString("vi-VN")} -{" "}
            {visit.staff_name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin viếng thăm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.shopName}
              </p>
              <p className="font-medium">{visit.shop_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.staffName}
              </p>
              <p className="font-medium">{visit.staff_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.area}
              </p>
              <p className="font-medium">{visit.area || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.contactPerson}
              </p>
              <p className="font-medium">{visit.contact_person || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">
                {labels.form.address}
              </p>
              <p className="font-medium">{visit.address || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">
                {labels.form.notes}
              </p>
              <p className="font-medium">{visit.notes || "-"}</p>
            </div>
            {visit.gps_lat && visit.gps_lng && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  {labels.form.gpsLocation}
                </p>
                <a
                  href={`https://maps.google.com/?q=${visit.gps_lat},${visit.gps_lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <MapPin className="h-4 w-4" />
                  {visit.gps_lat.toFixed(6)}, {visit.gps_lng.toFixed(6)}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.form.product}</TableHead>
                  <TableHead>{labels.form.unit}</TableHead>
                  <TableHead>{labels.form.dailyOutput}</TableHead>
                  <TableHead>{labels.form.price}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {p.product_name}
                    </TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell>
                      {p.daily_output?.toLocaleString("vi-VN") || "-"}
                    </TableCell>
                    <TableCell>
                      {p.price?.toLocaleString("vi-VN") || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{labels.form.photos}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {photos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={url}
                    alt={`Ảnh ${i + 1}`}
                    className="rounded-md object-cover aspect-square w-full"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
