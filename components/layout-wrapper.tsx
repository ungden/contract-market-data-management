"use client"

import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const pathname = usePathname()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!profile || pathname === "/login") {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 md:pl-64">
        <div className="mx-auto max-w-7xl p-4 pt-16 md:pt-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
