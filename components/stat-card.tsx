import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  iconBgColor?: string
}

export function StatCard({ title, value, change, changeType, icon: Icon, iconBgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-xs mt-2 font-medium",
                  changeType === "positive" && "text-green-500",
                  changeType === "negative" && "text-red-500",
                  changeType === "neutral" && "text-muted-foreground",
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", iconBgColor || "bg-primary/10")}>
            <Icon className={cn("h-5 w-5", iconBgColor ? "text-foreground" : "text-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
