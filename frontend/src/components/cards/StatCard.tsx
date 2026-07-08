import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/common/ui"
import clsx from "clsx"

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: "primary" | "success" | "warning" | "destructive"
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className={clsx(
          "flex size-11 shrink-0 items-center justify-center rounded-lg",
          tone === "primary" && "bg-accent text-accent-foreground",
          tone === "success" && "bg-success/10 text-success",
          tone === "warning" && "bg-warning/10 text-warning",
          tone === "destructive" && "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}
