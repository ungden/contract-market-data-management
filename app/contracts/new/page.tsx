"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CustomerSelect } from "@/components/customer-select"
import {
  getTemplates,
  addContract,
  getNextContractNumber,
} from "@/lib/database"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { ContractTemplate, TemplateField, Customer } from "@/lib/types"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewContractPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null)
  const [fields, setFields] = useState<TemplateField[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [contractNo, setContractNo] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )
  const [companyName, setCompanyName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

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

  const handleTemplateSelect = async (templateId: string | null) => {
    if (!templateId) return
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    setSelectedTemplate(template)
    try {
      const parsedFields: TemplateField[] = JSON.parse(
        template.fields_json || "[]"
      )
      setFields(parsedFields)
      const initial: Record<string, string> = {}
      parsedFields.forEach((f) => (initial[f.name] = ""))
      setFormData(initial)
    } catch {
      setFields([])
    }

    // Auto-generate contract number
    const year = new Date().getFullYear()
    try {
      const num = await getNextContractNumber(year)
      setContractNo(`HD/VIM/${year}/${String(num).padStart(3, "0")}`)
    } catch {
      setContractNo("")
    }
  }

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer)
    if (customer) {
      setCompanyName(customer.name)
    }
  }

  const handleSubmit = async () => {
    if (!profile || !selectedTemplate) return

    if (!contractNo || !companyName) {
      toast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    setSaving(true)
    try {
      const contract = await addContract({
        contract_no: contractNo,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || companyName,
        company_name: companyName,
        data_json: JSON.stringify(formData),
        year: new Date().getFullYear(),
        status: "draft",
        created_by: profile.id,
        creator_name: profile.display_name,
      })
      toast(labels.messages.saveSuccess)
      router.push(`/contracts/${contract.id}`)
    } catch {
      toast(labels.messages.saveError, "error")
    } finally {
      setSaving(false)
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/contracts" />}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{labels.pages.newContract}</h1>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              step >= s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Step 1: Choose customer */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Bước 1: Chọn khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomerSelect
              selectedCustomer={selectedCustomer}
              onSelect={handleCustomerSelect}
            />
            <div>
              <Label>{labels.form.companyName}</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Tên công ty đối tác"
              />
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!companyName}
              className="w-full"
            >
              Tiếp theo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose template & fill fields */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Bước 2: Chọn mẫu & điền thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{labels.form.templateName}</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mẫu hợp đồng" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{labels.form.contractNo}</Label>
              <Input
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
                placeholder="HD/VIM/2026/001"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Tự động tạo, có thể chỉnh sửa
              </p>
            </div>

            {fields.length > 0 && (
              <div className="space-y-4 rounded-md border bg-muted/30 p-4">
                <h3 className="font-medium">Thông tin hợp đồng</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {fields.map((field) => (
                    <div
                      key={field.name}
                      className={
                        field.type === "textarea" ? "md:col-span-2" : ""
                      }
                    >
                      <Label>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.name]: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <Input
                          type={
                            field.type === "date"
                              ? "date"
                              : field.type === "number"
                                ? "number"
                                : "text"
                          }
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.name]: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                {labels.buttons.back}
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedTemplate}
                className="flex-1"
              >
                {labels.buttons.preview}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 3 && selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Bước 3: Xem trước & Lưu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {labels.form.contractNo}:
                  </span>{" "}
                  <strong>{contractNo}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {labels.form.templateName}:
                  </span>{" "}
                  <strong>{selectedTemplate.name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {labels.form.customer}:
                  </span>{" "}
                  <strong>
                    {selectedCustomer?.name || companyName}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {labels.form.status}:
                  </span>{" "}
                  <Badge variant="secondary">{labels.status.draft}</Badge>
                </div>
              </div>

              {Object.entries(formData).length > 0 && (
                <>
                  <hr className="my-2" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(formData).map(([key, value]) => {
                      const field = fields.find((f) => f.name === key)
                      return (
                        <div
                          key={key}
                          className={
                            field?.type === "textarea"
                              ? "col-span-2"
                              : ""
                          }
                        >
                          <span className="text-muted-foreground">
                            {field?.label || key}:
                          </span>{" "}
                          <strong>{value || "-"}</strong>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Quay lại sửa
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Đang lưu..." : "Xác nhận & Lưu"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
