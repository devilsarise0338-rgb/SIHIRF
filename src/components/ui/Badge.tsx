import * as React from "react"
import { cn } from "@/src/lib/utils"

export function Badge({ children, variant = "neutral", className }: { children: React.ReactNode, variant?: "neutral" | "success" | "warning" | "danger", className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center text-xs font-medium uppercase tracking-wider",
      {
        "text-neutral": variant === "neutral",
        "text-pine": variant === "success",
        "text-ember": variant === "warning" || variant === "danger",
      },
      className
    )}>
      {children}
    </span>
  )
}
