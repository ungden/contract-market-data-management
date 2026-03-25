"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  getDashboardStats,
  getRecentContracts,
  getRecentVisits,
} from "@/lib/database"
import { PageLoading } from "@/components/loading-spinner"
import { labels } from "@/lib/i18n"
import type { Contract, MarketVisit } from "@/lib/types"
import {
  FileText,
  MapPin,
  Settings,
  Building2,
  Package,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    contracts: 0,
    visits: 0,
    templates: 0,
    customers: 0,
    products: 0,
  })
  const [recentContracts, setRecentContracts] = useState<Contract[]>([])
  const [recentVisits, setRecentVisits] = useState<MarketVisit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/login")
    }
  }, [profile, authLoading, router])

  useEffect(() => {
    if (!profile) return
    loadDashboard()
  }, [profile])

  const loadDashboard = async () => {
    try {
      const [s, rc, rv] = await Promise.all([
        getDashboardStats(),
        getRecentContracts(5),
        getRecentVisits(5),
      ])
      setStats(s)
      setRecentContracts(rc)
      setRecentVisits(rv)
    } catch (err) {
      console.error("Dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !profile) return null
  if (loading) return <PageLoading />

  const statCards = [
    {
      title: "Hợp đồng",
      value: stats.contracts,
      icon: FileText,
      roles: ["admin", "sale_admin"],
    },
    {
      title: "Viếng thăm",
      value: stats.visits,
      icon: MapPin,
      roles: ["admin", "sale_admin", "market_staff"],
    },
    {
      title: "Mẫu HĐ",
      value: stats.templates,
      icon: Settings,
      roles: ["admin", "sale_admin"],
    },
    {
      title: "Khách hàng",
      value: stats.customers,
      icon: Building2,
      roles: ["admin", "sale_admin", "market_staff"],
    },
    {
      title: "Sản phẩm",
      value: stats.products,
      icon: Package,
      roles: ["admin", "sale_admin"],
    },
  ]

  const visibleCards = statCards.filter((c) =>
    c.roles.includes(profile.role)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{labels.pages.dashboard}</h1>
        <p className="text-muted-foreground">
          Xin chào, {profile.display_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {visibleCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent contracts */}
        {(profile.role === "admin" || profile.role === "sale_admin") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Hợp đồng gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentContracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có hợp đồng
                </p>
              ) : (
                <Table>
                  <TableBody>
                    {recentContracts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Link
                            href={`/contracts/${c.id}`}
                            className="text-primary hover:underline"
                          >
                            {c.contract_no}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {c.customer_name || c.company_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {labels.status[c.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent visits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Viếng thăm gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVisits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có lượt viếng thăm
              </p>
            ) : (
              <Table>
                <TableBody>
                  {recentVisits.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Link
                          href={`/market-visits/${v.id}`}
                          className="text-primary hover:underline"
                        >
                          {v.customer_name || v.shop_name}
                        </Link>
                      </TableCell>
                      <TableCell>{v.staff_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(v.visit_date).toLocaleDateString(
                          "vi-VN"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
