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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  getContracts,
  deleteContract,
  duplicateContract,
} from "@/lib/database"
import { generateContractDocx } from "@/lib/docx-generator"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import { formatDate } from "@/lib/date-utils"
import type { Contract } from "@/lib/types"
import {
  Plus,
  Trash2,
  FileDown,
  Copy,
  Search,
  Download,
  Eye,
} from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

export default function ContractsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      const data = await getContracts()
      setContracts(data)
    } catch {
      toast(labels.messages.loadError, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(labels.messages.deleteConfirm)) return
    try {
      await deleteContract(id)
      setContracts((prev) => prev.filter((c) => c.id !== id))
      toast(labels.messages.deleteSuccess)
    } catch {
      toast(labels.messages.deleteError, "error")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateContract(id)
      toast("Sao chép hợp đồng thành công")
      loadContracts()
    } catch {
      toast("Sao chép hợp đồng thất bại", "error")
    }
  }

  const handleDownloadWord = async (contract: Contract) => {
    try {
      await generateContractDocx(contract)
      toast(labels.messages.exportSuccess)
    } catch {
      toast("Tạo file Word thất bại", "error")
    }
  }

  const handleExport = () => {
    const exportData = filtered.map((c) => ({
      "Số HĐ": c.contract_no,
      "Khách hàng": c.customer_name,
      "Công ty": c.company_name,
      "Mẫu HĐ": c.template_name,
      "Trạng thái": labels.status[c.status],
      "Người tạo": c.creator_name,
      "Ngày tạo": formatDate(c.created_at),
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Hợp đồng")
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buf]), "hop-dong.xlsx")
    toast(labels.messages.exportSuccess)
  }

  const filtered = contracts.filter((c) => {
    const matchSearch =
      c.contract_no.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.company_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const canManage = profile?.role === "admin" || profile?.role === "sale_admin"

  if (loading) return <PageLoading />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{labels.pages.contracts}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{labels.buttons.export}</span>
          </Button>
          {canManage && (
            <Button size="sm" render={<Link href="/contracts/new" />}>
              <Plus className="mr-2 h-4 w-4" />
              {labels.buttons.add}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo số HĐ, tên KH..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="draft">{labels.status.draft}</SelectItem>
            <SelectItem value="active">{labels.status.active}</SelectItem>
            <SelectItem value="completed">{labels.status.completed}</SelectItem>
            <SelectItem value="cancelled">{labels.status.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{labels.messages.noData}</p>
      ) : (
        <>
          {/* Mobile: Card view */}
          <div className="space-y-3 md:hidden">
            {filtered.map((c) => (
              <Link key={c.id} href={`/contracts/${c.id}`}>
                <Card className="active:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-semibold text-primary">
                          {c.contract_no}
                        </p>
                        <p className="font-medium mt-0.5 truncate">
                          {c.customer_name || c.company_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.template_name} · {formatDate(c.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant={c.status === "active" ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {labels.status[c.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.form.contractNo}</TableHead>
                  <TableHead>{labels.form.customer}</TableHead>
                  <TableHead>{labels.form.templateName}</TableHead>
                  <TableHead>{labels.form.createdBy}</TableHead>
                  <TableHead>{labels.form.createdAt}</TableHead>
                  <TableHead>{labels.form.status}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link href={`/contracts/${c.id}`} className="text-primary hover:underline">
                        {c.contract_no}
                      </Link>
                    </TableCell>
                    <TableCell>{c.customer_name || c.company_name}</TableCell>
                    <TableCell>{c.template_name}</TableCell>
                    <TableCell>{c.creator_name}</TableCell>
                    <TableCell>{formatDate(c.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>
                        {labels.status[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" render={<Link href={`/contracts/${c.id}`} />}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadWord(c)}>
                          <FileDown className="h-4 w-4" />
                        </Button>
                        {canManage && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleDuplicate(c.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground text-right">{filtered.length} hợp đồng</p>
    </div>
  )
}
