"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-bold">Đã xảy ra lỗi</h2>
      <p className="text-muted-foreground">
        Vui lòng thử lại hoặc liên hệ quản trị viên.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  )
}
