"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addCustomer } from "@/lib/database"
import { customerSchema } from "@/lib/schemas"
import { useToast } from "@/components/ui/sonner"
import { labels } from "@/lib/i18n"
import { ArrowLeft, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewCustomerPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    tax_code: "",
    address: "",
    bank_account: "",
    legal_representative: "",
    contact_person: "",
    phone: "",
    gps_lat: null as number | null,
    gps_lng: null as number | null,
    notes: "",
  })

  const isSaleAdmin = profile?.role === "admin" || profile?.role === "sale_admin"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    const parsed = customerSchema.safeParse(form)
    if (!parsed.success) {
      toast(parsed.error.issues[0].message, "error")
      return
    }

    setSaving(true)
    try {
      await addCustomer({
        ...form,
        tax_code: form.tax_code || null,
        address: form.address || null,
        bank_account: form.bank_account || null,
        legal_representative: form.legal_representative || null,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
        notes: form.notes || null,
        created_by: profile.id,
        creator_name: profile.display_name,
      })
      toast(labels.messages.saveSuccess)
      router.push("/customers")
    } catch {
      toast(labels.messages.saveError, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/customers" />}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{labels.pages.newCustomer}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{labels.form.name} *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>{labels.form.phone}</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <Label>{labels.form.contactPerson}</Label>
          <Input
            value={form.contact_person}
            onChange={(e) =>
              setForm({ ...form, contact_person: e.target.value })
            }
          />
        </div>

        <div>
          <Label>{labels.form.address}</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        {isSaleAdmin && (
          <>
            <div>
              <Label>{labels.form.taxCode}</Label>
              <Input
                value={form.tax_code}
                onChange={(e) =>
                  setForm({ ...form, tax_code: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{labels.form.bankAccount}</Label>
              <Input
                value={form.bank_account}
                onChange={(e) =>
                  setForm({ ...form, bank_account: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{labels.form.legalRep}</Label>
              <Input
                value={form.legal_representative}
                onChange={(e) =>
                  setForm({
                    ...form,
                    legal_representative: e.target.value,
                  })
                }
              />
            </div>
          </>
        )}

        <div>
          <Label>{labels.form.gpsLocation}</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleGPS}>
              <MapPin className="mr-2 h-4 w-4" />
              {labels.buttons.getLocation}
            </Button>
            {form.gps_lat && form.gps_lng && (
              <span className="flex items-center text-sm text-muted-foreground">
                {form.gps_lat.toFixed(6)}, {form.gps_lng.toFixed(6)}
              </span>
            )}
          </div>
        </div>

        <div>
          <Label>{labels.form.notes}</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang lưu...</> : labels.buttons.save}
          </Button>
          <Button type="button" variant="outline" render={<Link href="/customers" />}>
            {labels.buttons.cancel}
          </Button>
        </div>
      </form>
    </div>
  )
}
