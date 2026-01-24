import Link from "next/link"
import { Phone, Mail, DollarSign, Calendar, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Employee } from "@/lib/mock-data"

interface EmployeeCardProps {
  employee: Employee
  stats?: any // { projectId: { totalEarned, totalPaid, netDue, projectName } }
}

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  "on-leave": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

export function EmployeeCard({ employee, stats }: EmployeeCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {employee.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">{employee.role}</p>
              </div>
              <Badge variant="outline" className={cn("shrink-0", statusColors[employee.status])}>
                {employee.status}
              </Badge>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span className="truncate">{employee.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold">${employee.dailyRate}/day</span>
              </div>
            </div>

            {/* Project breakdown summary */}
            {stats && Object.keys(stats).length > 0 && (
              <div className="mt-4 space-y-2 pt-4 border-t border-dashed border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Project Balance Breakdown</p>
                <div className="space-y-1.5 min-h-[40px]">
                  {Object.entries(stats).map(([projId, s]: [string, any]) => (
                    <div key={projId} className="flex flex-col gap-1 p-2 rounded bg-muted/30 border border-border/5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold truncate max-w-[150px]">{s.projectName}</span>
                        <span className={cn("font-bold px-1.5 py-0.5 rounded text-[10px]", s.netDue > 0 ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600")}>
                          {s.netDue > 0 ? `Due: ₹${s.netDue.toLocaleString()}` : "Paid"}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground opacity-80">
                        <span>Earned: ₹{s.totalEarned.toLocaleString()}</span>
                        <span>Paid: ₹{s.totalPaid.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-4">
              {employee.skills.slice(0, 2).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {employee.skills.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{employee.skills.length - 2}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {new Date(employee.joinDate).toLocaleDateString()}</span>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-primary">
                <Link href={`/employees/${employee.id}`}>
                  View
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
