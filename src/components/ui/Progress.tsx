import * as React from "react"
import { cn } from "@/src/lib/utils"

export function Progress({ current, total, className }: { current: number, total: number, className?: string }) {
  return (
    <div className={cn("text-sm font-medium text-neutral", className)}>
      Step {current} / {total}
    </div>
  )
}
