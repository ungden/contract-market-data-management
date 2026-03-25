"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getUsers, updateUser, preCreateUser } from "@/lib/database"
import { useToast } from "@/components/ui/sonner"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { UserProfile, Role } from "@/lib/types"
import { UserPlus } from "lucide-react"

export default function AdminPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Role>("market_staff")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch {
      toast("Tải danh sách người dùng thất bại", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await updateUser(userId, { role })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      )
      toast("Cập nhật vai trò thành công")
    } catch {
      toast("Cập nhật vai trò thất bại", "error")
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await updateUser(userId, { is_active: !isActive })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !isActive } : u
        )
      )
      toast(isActive ? "Đã vô hiệu hóa tài khoản" : "Đã kích hoạt tài khoản")
    } catch {
      toast("Cập nhật trạng thái thất bại", "error")
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    try {
      await preCreateUser(inviteEmail.trim(), inviteRole)
      toast(labels.messages.inviteSuccess)
      setInviteOpen(false)
      setInviteEmail("")
      loadUsers()
    } catch {
      toast("Mời người dùng thất bại", "error")
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{labels.pages.admin}</h1>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger render={<Button />}>
            <UserPlus className="mr-2 h-4 w-4" />
            {labels.buttons.invite}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.buttons.invite}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>{labels.form.email}</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>{labels.form.role}</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => v && setInviteRole(v as Role)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      {labels.roles.admin}
                    </SelectItem>
                    <SelectItem value="sale_admin">
                      {labels.roles.sale_admin}
                    </SelectItem>
                    <SelectItem value="market_staff">
                      {labels.roles.market_staff}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} className="w-full">
                {labels.buttons.invite}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{labels.form.name}</TableHead>
              <TableHead>{labels.form.email}</TableHead>
              <TableHead>{labels.form.role}</TableHead>
              <TableHead>{labels.form.status}</TableHead>
              <TableHead>{labels.form.createdAt}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.display_name}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    onValueChange={(v) =>
                      v && handleRoleChange(u.id, v as Role)
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        {labels.roles.admin}
                      </SelectItem>
                      <SelectItem value="sale_admin">
                        {labels.roles.sale_admin}
                      </SelectItem>
                      <SelectItem value="market_staff">
                        {labels.roles.market_staff}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.is_active ? "default" : "secondary"}
                  >
                    {u.is_active
                      ? labels.status.enabled
                      : labels.status.disabled}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(u.created_at).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleToggleActive(u.id, u.is_active)
                    }
                  >
                    {u.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
