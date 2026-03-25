import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { ToastProvider } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Quản lý Hợp đồng & Thị trường",
  description:
    "Hệ thống quản lý hợp đồng thương mại và dữ liệu viếng thăm thị trường.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="font-sans">
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
