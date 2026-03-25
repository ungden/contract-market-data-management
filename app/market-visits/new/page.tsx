"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerSelect } from "@/components/customer-select"
import { ProductSelect } from "@/components/product-select"
import { addMarketVisit } from "@/lib/database"
import { uploadMultiplePhotos } from "@/lib/storage"
import { useToast } from "@/components/ui/sonner"
import { labels } from "@/lib/i18n"
import type { Customer, ProductLine } from "@/lib/types"
import { ArrowLeft, MapPin, Plus, Trash2, Camera, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewMarketVisitPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [shopName, setShopName] = useState("")
  const [area, setArea] = useState("")
  const [address, setAddress] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [notes, setNotes] = useState("")
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [productLines, setProductLines] = useState<ProductLine[]>([])
  const [photos, setPhotos] = useState<File[]>([])

  // Auto-capture GPS on page load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {}
      )
    }
  }, [])

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer)
    if (customer) {
      setShopName(customer.name)
      setAddress(customer.address || "")
      setContactPerson(customer.contact_person || "")
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast(labels.messages.gpsError, "error")
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast(labels.messages.gpsCaptured)
        setGpsLoading(false)
      },
      () => {
        toast(labels.messages.gpsError, "error")
        setGpsLoading(false)
      }
    )
  }

  const addProductLine = () => {
    if (productLines.length >= 5) return
    setProductLines([
      ...productLines,
      { product_id: "", product_name: "", unit: "", daily_output: null, price: null },
    ])
  }

  const removeProductLine = (index: number) => {
    setProductLines(productLines.filter((_, i) => i !== index))
  }

  const updateProductLine = (
    index: number,
    updates: Partial<ProductLine>
  ) => {
    setProductLines((prev) =>
      prev.map((pl, i) => (i === index ? { ...pl, ...updates } : pl))
    )
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !shopName) return

    setSaving(true)
    try {
      // Upload photos first
      let photoUrls: string[] = []
      if (photos.length > 0) {
        const tempId = crypto.randomUUID()
        photoUrls = await uploadMultiplePhotos(photos, tempId)
      }

      await addMarketVisit({
        staff_id: profile.id,
        staff_name: profile.display_name,
        visit_date: new Date().toISOString(),
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || shopName,
        shop_name: shopName,
        area: area || null,
        address: address || null,
        contact_person: contactPerson || null,
        notes: notes || null,
        gps_lat: gps?.lat || null,
        gps_lng: gps?.lng || null,
        product_lines: productLines.length > 0 ? productLines : null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
      })

      toast(labels.messages.saveSuccess)
      router.push("/market-visits")
    } catch {
      toast(labels.messages.saveError, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/market-visits" />}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{labels.pages.newVisit}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer selection */}
        <Card>
          <CardHeader>
            <CardTitle>{labels.form.customer}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomerSelect
              selectedCustomer={selectedCustomer}
              onSelect={handleCustomerSelect}
            />
            <div>
              <Label>{labels.form.shopName} *</Label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{labels.form.area}</Label>
                <Input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
              <div>
                <Label>{labels.form.contactPerson}</Label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>{labels.form.address}</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* GPS - prominent for field workers */}
            <div className={`flex items-center gap-3 rounded-lg border p-3 ${gps ? "border-green-200 bg-green-50" : "bg-muted/30"}`}>
              <Button
                type="button"
                variant={gps ? "outline" : "default"}
                size="sm"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="shrink-0"
              >
                {gpsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                {gps ? "Cập nhật GPS" : "Lấy vị trí GPS"}
              </Button>
              {gps ? (
                <span className="text-sm text-green-700">
                  {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Nhấn để ghi nhận vị trí hiện tại
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product lines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sản phẩm</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProductLine}
                disabled={productLines.length >= 5}
              >
                <Plus className="mr-2 h-4 w-4" />
                {labels.buttons.addRow}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {productLines.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Chưa có sản phẩm. Nhấn &quot;Thêm dòng&quot; để thêm.
              </p>
            )}
            {productLines.map((pl, i) => (
              <div key={i} className="flex items-end gap-2 rounded-md border p-3">
                <div className="flex-1">
                  <Label>Sản phẩm</Label>
                  <ProductSelect
                    value={pl.product_id}
                    onSelect={(p) =>
                      updateProductLine(i, {
                        product_id: p.product_id,
                        product_name: p.product_name,
                        unit: p.unit,
                      })
                    }
                  />
                </div>
                <div className="w-24">
                  <Label>{labels.form.dailyOutput}</Label>
                  <Input
                    type="number"
                    value={pl.daily_output ?? ""}
                    onChange={(e) =>
                      updateProductLine(i, {
                        daily_output: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div className="w-24">
                  <Label>{labels.form.price}</Label>
                  <Input
                    type="number"
                    value={pl.price ?? ""}
                    onChange={(e) =>
                      updateProductLine(i, {
                        price: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProductLine(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notes & photos */}
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú & Hình ảnh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{labels.form.notes}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>{labels.form.photos}</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" render={<label className="cursor-pointer" />}>
                    <Camera className="mr-2 h-4 w-4" />
                    {labels.buttons.uploadPhoto}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                </Button>
                {photos.length > 0 && (
                  <span className="flex items-center text-sm text-muted-foreground">
                    {photos.length} ảnh đã chọn
                  </span>
                )}
              </div>
              {photos.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {photos.map((f, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <button
                        type="button"
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                        onClick={() =>
                          setPhotos(photos.filter((_, j) => j !== i))
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || !shopName} className="flex-1">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang lưu...</> : labels.buttons.save}
          </Button>
          <Button type="button" variant="outline" render={<Link href="/market-visits" />}>
            {labels.buttons.cancel}
          </Button>
        </div>
      </form>
    </div>
  )
}
