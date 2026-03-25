"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminDataTable } from "@/components/admin-data-table"
import {
  getUsers,
  updateUser,
  preCreateUser,
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getTemplates,
  addTemplate,
  deleteTemplate,
  getContracts,
  updateContract,
  deleteContract,
  getMarketVisits,
  deleteMarketVisit,
  getDashboardStats,
} from "@/lib/database"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import { formatDate, formatDateTime } from "@/lib/date-utils"
import type { UserProfile, Customer, Product, ContractTemplate, Contract, MarketVisit, Role } from "@/lib/types"
import {
  Users,
  Building2,
  Package,
  FileText,
  Settings,
  MapPin,
  Database,
  Download,
  UserPlus,
  RefreshCw,
  Loader2,
  Activity,
  Shield,
} from "lucide-react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import Link from "next/link"

// ============================================
// Main Admin Panel
// ============================================
export default function AdminPanel() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Data states
  const [stats, setStats] = useState({ contracts: 0, visits: 0, templates: 0, customers: 0, products: 0 })
  const [users, setUsers] = useState<UserProfile[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [visits, setVisits] = useState<MarketVisit[]>([])

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Role>("market_staff")
  const [inviting, setInviting] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      const [s, u, c, p, t, ct, v] = await Promise.all([
        getDashboardStats(),
        getUsers(),
        getCustomers(),
        getProducts(),
        getTemplates(),
        getContracts(),
        getMarketVisits(),
      ])
      setStats(s)
      setUsers(u)
      setCustomers(c)
      setProducts(p)
      setTemplates(t)
      setContracts(ct)
      setVisits(v)
    } catch {
      toast("Tải dữ liệu thất bại", "error")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleRefresh = () => {
    setRefreshing(true)
    loadAll()
  }

  // ---- User handlers ----
  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await updateUser(userId, { role })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      toast("Cập nhật vai trò thành công")
    } catch {
      toast("Cập nhật thất bại", "error")
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await updateUser(userId, { is_active: !isActive })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u)))
      toast(isActive ? "Đã vô hiệu hóa" : "Đã kích hoạt")
    } catch {
      toast("Cập nhật thất bại", "error")
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const user = await preCreateUser(inviteEmail.trim(), inviteRole)
      setUsers((prev) => [user, ...prev])
      toast("Mời người dùng thành công")
      setInviteOpen(false)
      setInviteEmail("")
    } catch {
      toast("Mời thất bại", "error")
    } finally {
      setInviting(false)
    }
  }

  // ---- Export handler ----
  const handleExportAll = async () => {
    try {
      const wb = XLSX.utils.book_new()
      const tables = [
        { data: users, name: "Người dùng" },
        { data: customers, name: "Khách hàng" },
        { data: products, name: "Sản phẩm" },
        { data: templates, name: "Mẫu HĐ" },
        { data: contracts, name: "Hợp đồng" },
        { data: visits, name: "Viếng thăm" },
      ]
      tables.forEach(({ data, name }) => {
        const ws = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, name)
      })
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      saveAs(new Blob([buf]), `backup-${new Date().toISOString().split("T")[0]}.xlsx`)
      toast("Xuất dữ liệu thành công")
    } catch {
      toast("Xuất thất bại", "error")
    }
  }

  const handleExportTable = (data: unknown[], name: string) => {
    const ws = XLSX.utils.json_to_sheet(data as Record<string, unknown>[])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, name)
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buf]), `${name}.xlsx`)
    toast("Xuất thành công")
  }

  if (profile?.role !== "admin") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{labels.messages.noAccess}</p>
      </div>
    )
  }

  if (loading) return <PageLoading />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
            <p className="text-sm text-muted-foreground">Quản lý toàn bộ hệ thống</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Backup toàn bộ</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => v && setActiveTab(v)} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Người dùng</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{users.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Khách hàng</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{customers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sản phẩm</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{products.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hợp đồng</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{contracts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mẫu HĐ</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{templates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Viếng thăm</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{visits.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ==================== OVERVIEW ==================== */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Người dùng", value: users.length, icon: Users, tab: "users" },
              { label: "Khách hàng", value: customers.length, icon: Building2, tab: "customers" },
              { label: "Sản phẩm", value: products.length, icon: Package, tab: "products" },
              { label: "Hợp đồng", value: contracts.length, icon: FileText, tab: "contracts" },
              { label: "Viếng thăm", value: visits.length, icon: MapPin, tab: "visits" },
            ].map((s) => (
              <Card
                key={s.label}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab(s.tab)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <s.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{s.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="justify-start" onClick={() => { setActiveTab("users"); setTimeout(() => setInviteOpen(true), 100) }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Mời người dùng
                </Button>
                <Button variant="outline" className="justify-start" render={<Link href="/customers/new" />}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Thêm khách hàng
                </Button>
                <Button variant="outline" className="justify-start" render={<Link href="/contracts/new" />}>
                  <FileText className="mr-2 h-4 w-4" />
                  Tạo hợp đồng
                </Button>
                <Button variant="outline" className="justify-start" onClick={handleExportAll}>
                  <Database className="mr-2 h-4 w-4" />
                  Backup dữ liệu
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Hợp đồng gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contracts.slice(0, 5).map((c) => (
                    <Link key={c.id} href={`/contracts/${c.id}`} className="flex items-center justify-between py-1 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-mono">{c.contract_no}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.customer_name}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{labels.status[c.status]}</Badge>
                    </Link>
                  ))}
                  {contracts.length === 0 && <p className="text-sm text-muted-foreground">Chưa có</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Viếng thăm gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visits.slice(0, 5).map((v) => (
                    <Link key={v.id} href={`/market-visits/${v.id}`} className="flex items-center justify-between py-1 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{v.customer_name || v.shop_name}</p>
                        <p className="text-xs text-muted-foreground">{v.staff_name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(v.visit_date)}</span>
                    </Link>
                  ))}
                  {visits.length === 0 && <p className="text-sm text-muted-foreground">Chưa có</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== USERS ==================== */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quản lý người dùng</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportTable(users, "users")}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Excel
              </Button>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <UserPlus className="mr-2 h-3.5 w-3.5" />
                  Mời
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mời người dùng mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label>Vai trò</Label>
                      <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v as Role)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{labels.roles.admin}</SelectItem>
                          <SelectItem value="sale_admin">{labels.roles.sale_admin}</SelectItem>
                          <SelectItem value="market_staff">{labels.roles.market_staff}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleInvite} disabled={inviting} className="w-full">
                      {inviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang mời...</> : "Mời người dùng"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tên</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Vai trò</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Trạng thái</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Ngày tạo</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-medium">{u.display_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border bg-transparent px-2 py-1 text-xs"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      >
                        <option value="admin">{labels.roles.admin}</option>
                        <option value="sale_admin">{labels.roles.sale_admin}</option>
                        <option value="market_staff">{labels.roles.market_staff}</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={u.is_active ? "default" : "secondary"} className="text-[10px]">
                        {u.is_active ? "Hoạt động" : "Vô hiệu"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                      >
                        {u.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ==================== CUSTOMERS ==================== */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quản lý khách hàng</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportTable(customers, "khach-hang")}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Excel
              </Button>
              <Button size="sm" render={<Link href="/customers/new" />}>
                <Building2 className="mr-2 h-3.5 w-3.5" />
                Thêm KH
              </Button>
            </div>
          </div>
          <AdminDataTable
            data={customers}
            title="khách hàng"
            searchKeys={["name", "phone", "tax_code", "address"]}
            columns={[
              { key: "name", label: "Tên", editable: true },
              { key: "phone", label: "SĐT", editable: true },
              { key: "tax_code", label: "MST", editable: true },
              { key: "contact_person", label: "Liên hệ", editable: true },
              { key: "address", label: "Địa chỉ", editable: true, render: (c) => (
                <span className="max-w-[200px] truncate block">{(c as Customer).address || "-"}</span>
              )},
              { key: "created_at", label: "Ngày tạo", render: (c) => (
                <span className="text-xs text-muted-foreground">{formatDate((c as Customer).created_at)}</span>
              )},
            ]}
            onEdit={async (id, updates) => {
              const updated = await updateCustomer(id, updates as Partial<Customer>)
              setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)))
              toast("Cập nhật thành công")
            }}
            onDelete={async (id) => {
              await deleteCustomer(id)
              setCustomers((prev) => prev.filter((c) => c.id !== id))
              toast("Xóa thành công")
            }}
          />
        </TabsContent>

        {/* ==================== PRODUCTS ==================== */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quản lý sản phẩm</h2>
            <Button variant="outline" size="sm" onClick={() => handleExportTable(products, "san-pham")}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Excel
            </Button>
          </div>
          <AdminDataTable
            data={products}
            title="sản phẩm"
            searchKeys={["name", "origin", "unit"]}
            columns={[
              { key: "name", label: "Tên sản phẩm", editable: true },
              { key: "origin", label: "Xuất xứ", editable: true },
              { key: "unit", label: "Đơn vị", editable: true },
              { key: "created_at", label: "Ngày tạo", render: (p) => (
                <span className="text-xs text-muted-foreground">{formatDate((p as Product).created_at)}</span>
              )},
            ]}
            addFields={[
              { key: "name", label: "Tên sản phẩm", required: true },
              { key: "origin", label: "Xuất xứ" },
              { key: "unit", label: "Đơn vị", required: true },
            ]}
            onAdd={async (data) => {
              if (!profile) return
              const p = await addProduct({
                name: String(data.name),
                origin: String(data.origin || "") || null,
                unit: String(data.unit),
                created_by: profile.id,
              })
              setProducts((prev) => [p, ...prev])
              toast("Thêm sản phẩm thành công")
            }}
            onEdit={async (id, updates) => {
              const updated = await updateProduct(id, updates as Partial<Product>)
              setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
              toast("Cập nhật thành công")
            }}
            onDelete={async (id) => {
              await deleteProduct(id)
              setProducts((prev) => prev.filter((p) => p.id !== id))
              toast("Xóa thành công")
            }}
          />
        </TabsContent>

        {/* ==================== CONTRACTS ==================== */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quản lý hợp đồng</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportTable(contracts, "hop-dong")}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Excel
              </Button>
              <Button size="sm" render={<Link href="/contracts/new" />}>
                <FileText className="mr-2 h-3.5 w-3.5" />
                Tạo HĐ
              </Button>
            </div>
          </div>
          <AdminDataTable
            data={contracts}
            title="hợp đồng"
            searchKeys={["contract_no", "customer_name", "company_name"]}
            columns={[
              { key: "contract_no", label: "Số HĐ", render: (c) => (
                <Link href={`/contracts/${(c as Contract).id}`} className="font-mono text-primary hover:underline text-xs">
                  {(c as Contract).contract_no}
                </Link>
              )},
              { key: "customer_name", label: "Khách hàng" },
              { key: "template_name", label: "Mẫu" },
              { key: "status", label: "Trạng thái", editable: true, type: "select", options: [
                { value: "draft", label: "Nháp" },
                { value: "active", label: "Hoạt động" },
                { value: "completed", label: "Hoàn thành" },
                { value: "cancelled", label: "Đã hủy" },
              ], render: (c) => (
                <Badge variant={(c as Contract).status === "active" ? "default" : "secondary"} className="text-[10px]">
                  {labels.status[(c as Contract).status]}
                </Badge>
              )},
              { key: "creator_name", label: "Người tạo" },
              { key: "created_at", label: "Ngày tạo", render: (c) => (
                <span className="text-xs text-muted-foreground">{formatDate((c as Contract).created_at)}</span>
              )},
            ]}
            onEdit={async (id, updates) => {
              const updated = await updateContract(id, updates as Partial<Contract>)
              setContracts((prev) => prev.map((c) => (c.id === id ? updated : c)))
              toast("Cập nhật thành công")
            }}
            onDelete={async (id) => {
              await deleteContract(id)
              setContracts((prev) => prev.filter((c) => c.id !== id))
              toast("Xóa thành công")
            }}
          />
        </TabsContent>

        {/* ==================== TEMPLATES ==================== */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quản lý mẫu hợp đồng</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportTable(templates, "mau-hd")}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Excel
              </Button>
              <Button size="sm" render={<Link href="/templates" />}>
                <Settings className="mr-2 h-3.5 w-3.5" />
                Quản lý mẫu
              </Button>
            </div>
          </div>
          <AdminDataTable
            data={templates}
            title="mẫu hợp đồng"
            searchKeys={["name", "type"]}
            columns={[
              { key: "name", label: "Tên mẫu" },
              { key: "type", label: "Loại" },
              { key: "description", label: "Mô tả", render: (t) => (
                <span className="max-w-[200px] truncate block text-muted-foreground">
                  {(t as ContractTemplate).description || "-"}
                </span>
              )},
              { key: "fields_json", label: "Số trường", render: (t) => {
                try { return JSON.parse((t as ContractTemplate).fields_json || "[]").length }
                catch { return 0 }
              }},
              { key: "created_at", label: "Ngày tạo", render: (t) => (
                <span className="text-xs text-muted-foreground">{formatDate((t as ContractTemplate).created_at)}</span>
              )},
            ]}
            onDelete={async (id) => {
              await deleteTemplate(id)
              setTemplates((prev) => prev.filter((t) => t.id !== id))
              toast("Xóa thành công")
            }}
          />
        </TabsContent>

        {/* ==================== MARKET VISITS ==================== */}
        <TabsContent value="visits" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quản lý viếng thăm</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportTable(visits, "vieng-tham")}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Excel
              </Button>
              <Button size="sm" render={<Link href="/market-visits/new" />}>
                <MapPin className="mr-2 h-3.5 w-3.5" />
                Ghi nhận
              </Button>
            </div>
          </div>
          <AdminDataTable
            data={visits}
            title="viếng thăm"
            searchKeys={["shop_name", "customer_name", "staff_name", "area"]}
            columns={[
              { key: "visit_date", label: "Ngày", render: (v) => (
                <span className="text-xs whitespace-nowrap">{formatDate((v as MarketVisit).visit_date)}</span>
              )},
              { key: "staff_name", label: "Nhân viên" },
              { key: "customer_name", label: "Khách hàng", render: (v) => (
                <Link href={`/market-visits/${(v as MarketVisit).id}`} className="text-primary hover:underline">
                  {(v as MarketVisit).customer_name || (v as MarketVisit).shop_name}
                </Link>
              )},
              { key: "area", label: "Khu vực", render: (v) => (v as MarketVisit).area || "-" },
              { key: "product_lines", label: "SP", render: (v) => {
                const lines = ((v as MarketVisit).product_lines || []) as Array<{ product_name: string }>
                return lines.length > 0 ? (
                  <span className="text-xs">{lines.length} SP</span>
                ) : "-"
              }},
              { key: "gps_lat", label: "GPS", render: (v) => (
                (v as MarketVisit).gps_lat ? (
                  <a
                    href={`https://maps.google.com/?q=${(v as MarketVisit).gps_lat},${(v as MarketVisit).gps_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                  </a>
                ) : <span className="text-muted-foreground">-</span>
              )},
            ]}
            onDelete={async (id) => {
              await deleteMarketVisit(id)
              setVisits((prev) => prev.filter((v) => v.id !== id))
              toast("Xóa thành công")
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
