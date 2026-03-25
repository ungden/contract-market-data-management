"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  getCustomer,
  updateCustomer,
  getContractsByCustomer,
  getMarketVisitsByCustomer,
} from "@/lib/database"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { Customer, Contract, MarketVisit } from "@/lib/types"
import { ArrowLeft, MapPin, Save } from "lucide-react"
import Link from "next/link"

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [visits, setVisits] = useState<MarketVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Customer>>({})

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [c, ct, v] = await Promise.all([
        getCustomer(id),
        getContractsByCustomer(id),
        getMarketVisitsByCustomer(id),
      ])
      setCustomer(c)
      setForm(c)
      setContracts(ct)
      setVisits(v)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const updated = await updateCustomer(id, form)
      setCustomer(updated)
      setEditing(false)
      toast(labels.messages.saveSuccess)
    } catch {
      toast(labels.messages.saveError, "error")
    }
  }

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast(labels.messages.gpsError, "error")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          gps_lat: pos.coords.latitude,
          gps_lng: pos.coords.longitude,
        }))
        toast(labels.messages.gpsCaptured)
      },
      () => toast(labels.messages.gpsError, "error")
    )
  }

  if (loading) return <PageLoading />
  if (!customer) return <p className="p-8 text-center">{labels.messages.noData}</p>

  const canEdit =
    profile?.role === "admin" || customer.created_by === profile?.id

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/customers" />}>
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
        </div>
        {canEdit && !editing && (
          <Button onClick={() => setEditing(true)}>
            {labels.buttons.edit}
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {labels.buttons.save}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForm(customer)
                setEditing(false)
              }}
            >
              {labels.buttons.cancel}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Thông tin</TabsTrigger>
          <TabsTrigger value="contracts">
            Hợp đồng ({contracts.length})
          </TabsTrigger>
          <TabsTrigger value="visits">
            Viếng thăm ({visits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>{labels.form.name}</Label>
              {editing ? (
                <Input
                  value={form.name || ""}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">{customer.name}</p>
              )}
            </div>
            <div>
              <Label>{labels.form.phone}</Label>
              {editing ? (
                <Input
                  value={form.phone || ""}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">{customer.phone || "-"}</p>
              )}
            </div>
            <div>
              <Label>{labels.form.taxCode}</Label>
              {editing ? (
                <Input
                  value={form.tax_code || ""}
                  onChange={(e) =>
                    setForm({ ...form, tax_code: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">{customer.tax_code || "-"}</p>
              )}
            </div>
            <div>
              <Label>{labels.form.contactPerson}</Label>
              {editing ? (
                <Input
                  value={form.contact_person || ""}
                  onChange={(e) =>
                    setForm({ ...form, contact_person: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">
                  {customer.contact_person || "-"}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>{labels.form.address}</Label>
              {editing ? (
                <Input
                  value={form.address || ""}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">{customer.address || "-"}</p>
              )}
            </div>
            <div>
              <Label>{labels.form.legalRep}</Label>
              {editing ? (
                <Input
                  value={form.legal_representative || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      legal_representative: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">
                  {customer.legal_representative || "-"}
                </p>
              )}
            </div>
            <div>
              <Label>{labels.form.bankAccount}</Label>
              {editing ? (
                <Input
                  value={form.bank_account || ""}
                  onChange={(e) =>
                    setForm({ ...form, bank_account: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">
                  {customer.bank_account || "-"}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>{labels.form.gpsLocation}</Label>
              {editing ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGPS}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {labels.buttons.getLocation}
                  </Button>
                  {form.gps_lat && form.gps_lng && (
                    <span className="flex items-center text-sm text-muted-foreground">
                      {form.gps_lat.toFixed(6)}, {form.gps_lng.toFixed(6)}
                    </span>
                  )}
                </div>
              ) : customer.gps_lat && customer.gps_lng ? (
                <a
                  href={`https://www.google.com/maps?q=${customer.gps_lat},${customer.gps_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <MapPin className="h-3 w-3" />
                  {customer.gps_lat.toFixed(6)},{" "}
                  {customer.gps_lng.toFixed(6)}
                </a>
              ) : (
                <p className="mt-1 text-sm">-</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>{labels.form.notes}</Label>
              {editing ? (
                <Textarea
                  value={form.notes || ""}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-sm">{customer.notes || "-"}</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="pt-4">
          {contracts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Chưa có hợp đồng
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{labels.form.contractNo}</TableHead>
                    <TableHead>{labels.form.templateName}</TableHead>
                    <TableHead>{labels.form.status}</TableHead>
                    <TableHead>{labels.form.createdAt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link
                          href={`/contracts/${c.id}`}
                          className="text-primary hover:underline"
                        >
                          {c.contract_no}
                        </Link>
                      </TableCell>
                      <TableCell>{c.template_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {labels.status[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(c.created_at).toLocaleDateString(
                          "vi-VN"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="visits" className="pt-4">
          {visits.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Chưa có lượt viếng thăm
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{labels.form.visitDate}</TableHead>
                    <TableHead>{labels.form.staffName}</TableHead>
                    <TableHead>{labels.form.area}</TableHead>
                    <TableHead>{labels.form.notes}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Link
                          href={`/market-visits/${v.id}`}
                          className="text-primary hover:underline"
                        >
                          {new Date(v.visit_date).toLocaleDateString(
                            "vi-VN"
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>{v.staff_name}</TableCell>
                      <TableCell>{v.area || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {v.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
