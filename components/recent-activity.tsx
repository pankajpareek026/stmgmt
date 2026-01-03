import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ClipboardCheck, DollarSign, Users, FolderKanban } from "lucide-react"

interface Activity {
  id: string
  type: "attendance" | "payroll" | "employee" | "project"
  message: string
  time: string
  user?: string
}

const activities: Activity[] = [
  {
    id: "1",
    type: "attendance",
    message: "James Wilson checked in at Downtown Office Complex",
    time: "2 hours ago",
    user: "JW",
  },
  {
    id: "2",
    type: "payroll",
    message: "Payroll processed for 24 employees - January 2024",
    time: "4 hours ago",
  },
  {
    id: "3",
    type: "employee",
    message: "New employee Maria Garcia added to Residential Tower project",
    time: "5 hours ago",
    user: "MG",
  },
  {
    id: "4",
    type: "project",
    message: "Downtown Office Complex reached 65% completion",
    time: "1 day ago",
  },
  {
    id: "5",
    type: "attendance",
    message: "Robert Chen marked overtime - 2.5 hours",
    time: "1 day ago",
    user: "RC",
  },
]

interface RecentActivityProps {
  activities: Activity[]
}

const activityIcons = {
  attendance: ClipboardCheck,
  payroll: DollarSign,
  employee: Users,
  project: FolderKanban,
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type]

            return (
              <div key={activity.id} className="flex items-start gap-3">
                {activity.user ? (
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{activity.user}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
