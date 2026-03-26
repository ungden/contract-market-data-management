"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getContract,
  updateContract,
  duplicateContract,
} from "@/lib/database"
import { generateContractDocx } from "@/lib/docx-generator"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { Contract, TemplateField } from "@/lib/types"
import { ArrowLeft, FileDown, Copy } from "lucide-react"
import Link from "next/link"

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContract()
  }, [id])

  const loadContract = async () => {
    try {
      const data = await getContract(id)
      setContract(data)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (status: string | null) => {
    if (!status) return
    if (!contract) return
    try {
      const updated = await updateContract(id, {
        status: status as Contract["status"],
      })
      setContract(updated)
      toast(labels.messages.saveSuccess)
    } catch {
      toast(labels.messages.saveError, "error")
    }
  }

  const handleDownload = async () => {
    if (!contract) return
    try {
      await generateContractDocx(contract)
      toast(labels.messages.exportSuccess)
    } catch {
      toast("Tạo file Word thất bại", "error")
    }
  }

  const handleDuplicate = async () => {
    if (!contract) return
    try {
      const newContract = await duplicateContract(contract.id)
      toast("Sao chép hợp đồng thành công")
      window.location.href = `/contracts/${newContract.id}`
    } catch {
      toast("Sao chép hợp đồng thất bại", "error")
    }
  }

  if (loading) return <PageLoading />
  if (!contract)
    return <p className="p-8 text-center">{labels.messages.noData}</p>

  const data = JSON.parse(contract.data_json || "{}")
  const canManage =
    profile?.role === "admin" || profile?.role === "sale_admin"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/contracts" />}>
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contract.contract_no}</h1>
            <p className="text-sm text-muted-foreground">
              {contract.template_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <FileDown className="mr-2 h-4 w-4" />
            Tải Word
          </Button>
          {canManage && (
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              {labels.buttons.duplicate}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Thông tin hợp đồng</CardTitle>
            {canManage && (
              <Select
                value={contract.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    {labels.status.draft}
                  </SelectItem>
                  <SelectItem value="active">
                    {labels.status.active}
                  </SelectItem>
                  <SelectItem value="completed">
                    {labels.status.completed}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {labels.status.cancelled}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            {!canManage && (
              <Badge
                variant={
                  contract.status === "active" ? "default" : "secondary"
                }
              >
                {labels.status[contract.status]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.contractNo}
              </p>
              <p className="font-medium">{contract.contract_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.customer}
              </p>
              <p className="font-medium">
                {contract.customer_name || contract.company_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.templateName}
              </p>
              <p className="font-medium">{contract.template_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.year}
              </p>
              <p className="font-medium">{contract.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.createdBy}
              </p>
              <p className="font-medium">{contract.creator_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.form.createdAt}
              </p>
              <p className="font-medium">
                {new Date(contract.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          {Object.keys(data).length > 0 && (
            <>
              <hr className="my-6" />
              <h3 className="mb-4 font-medium">Chi tiết hợp đồng</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-muted-foreground">{key}</p>
                    <p className="font-medium">{String(value) || "-"}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
