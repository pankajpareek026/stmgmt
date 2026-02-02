"use client"

import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/mock-data"
import { useCurrency } from "@/components/currency-provider"

interface ProjectStatusCardProps {
  project: Project
}

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "on-hold": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  planning: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  const { formatCompact } = useCurrency()
  const budgetPercent = (project.spent / project.budget) * 100

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold capitalize truncate">{project.name}</CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate capitalize">{project.location}</span>
            </div>
          </div>
          <Badge variant="outline" className={cn("shrink-0", statusColors[project.status])}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold">{project.completion}%</span>
          </div>
          <Progress value={project.completion} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Budget</p>
            <p className="font-semibold mt-1">{formatCompact(project.budget)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Spent</p>
            <p className="font-semibold mt-1">
              {formatCompact(project.spent)}
              <span
                className={cn(
                  "text-xs ml-1",
                  budgetPercent > 90 ? "text-red-500" : budgetPercent > 75 ? "text-yellow-500" : "text-green-500",
                )}
              >
                ({budgetPercent.toFixed(0)}%)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">{project.workers} workers</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-primary">
            <Link href={`/projects/${project.id}`}>
              View
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
