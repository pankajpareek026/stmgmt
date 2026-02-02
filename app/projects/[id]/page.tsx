
"use client"

import { Suspense, useState, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  Edit,
  MoreVertical,
  Briefcase,
  Clock,
  Search,
  Filter,
  Plus,
  Check,
  X,
  FolderKanban,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useApi } from "@/hooks/use-api"
import { Project, Employee, Expense, Attendance } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { MarkAttendanceDialog } from "@/components/mark-attendance-dialog"
import { apiService } from "@/lib/api-service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import { ManageMembersDialog } from "@/components/manage-members-dialog"
import { ProcessPayrollDialog } from "@/components/process-payroll-dialog"

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "on-hold": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  planning: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

function ProjectDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const [showMarkAttendance, setShowMarkAttendance] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showManageMembers, setShowManageMembers] = useState(false)
  const [showProcessPayroll, setShowProcessPayroll] = useState(false)

  const { data: project, loading, error, refresh: refreshProject } = useApi<Project>(`/projects/${id}`)
  const { data: employeesData, refresh: refreshEmployees } = useApi<Employee[]>("/employees")
  const { data: expensesData, refresh: refreshExpenses } = useApi<Expense[]>("/expenses")
  const { data: attendanceData, refresh: refreshAttendance } = useApi<Attendance[]>("/attendance")

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await apiService.delete(`/projects/${id}`)
        toast.success("Project deleted successfully")
        router.push("/projects")
      } catch (err) {
        toast.error("Failed to delete project")
        console.error(err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading project details...</span>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-4">{error || "The project you're looking for doesn't exist"}</p>
        <Button asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>
    )
  }

  const projectEmployees = (project.employeeIds || []).map((e: any) => {
    // If e is an object (populated), return it. If it's a string, find it in employeesData.
    if (typeof e === 'object' && e !== null) return e as Employee
    return (employeesData || []).find((emp: Employee) => (emp.id || (emp as any)._id) === e)
  }).filter(Boolean) as Employee[]
  const projectExpenses = (expensesData || []).filter((e: Expense) => e.projectId === id)

  // Fix: Handle populated projectId (can be object or string)
  const projectAttendance = (attendanceData || []).filter((a: Attendance) => {
    const attProjectId = typeof a.projectId === 'object' && a.projectId !== null
      ? (a.projectId as any)._id || (a.projectId as any).id
      : a.projectId;
    return attProjectId === id;
  })

  // Helper functions to handle both flat mock data and populated API data
  const getEmployeeName = (att: any) => {
    if (att.employeeName) return att.employeeName
    return att.employeeId?.name || "Unknown Employee"
  }

  const getProjectName = (att: any) => {
    if (att.projectName) return att.projectName
    return att.projectId?.name || "Unknown Project"
  }

  const budgetPercent = project.budget > 0 ? (project.spent / project.budget) * 100 : 0

  const totalHours = projectAttendance.reduce((sum: number, a: Attendance) => sum + a.hours, 0)
  const totalOvertimeHours = projectAttendance.reduce((sum: number, a: Attendance) => sum + a.overtime, 0)
  const presentToday = projectAttendance.filter((a: Attendance) => {
    const today = new Date().toISOString().split("T")[0]
    const recordDate = new Date(a.date).toISOString().split("T")[0]
    return recordDate === today && (a.status === "present" || a.status === "overtime")
  }).length
  const overtimeToday = projectAttendance.filter((a: Attendance) => {
    const today = new Date().toISOString().split("T")[0]
    const recordDate = new Date(a.date).toISOString().split("T")[0]
    return recordDate === today && a.status === "overtime"
  }).length

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-2">
        <Link href="/projects">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Link>
      </Button>

      {/* Project Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-balance">{project.name}</h1>
            <Badge variant="outline" className={cn(statusColors[project.status as keyof typeof statusColors])}>
              {project.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{project.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{projectEmployees.length} workers</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowMarkAttendance(true)}>
            <Users className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
          <Button
            variant="secondary"
            className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
            onClick={() => setShowProcessPayroll(true)}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{project.completion}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">${(project.budget / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold">${(project.spent / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Size</p>
                <p className="text-2xl font-bold">{projectEmployees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline & Budget */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Project Timeline</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.startDate).toLocaleDateString()} -{" "}
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Duration:{" "}
                    {Math.ceil(
                      (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Budget Progress</span>
                  <span className="text-sm font-semibold">
                    ${(project.spent / 1000).toFixed(0)}K / ${(project.budget / 1000).toFixed(0)}K
                  </span>
                </div>
                <Progress
                  value={budgetPercent}
                  className={cn(
                    "h-2",
                    budgetPercent > 90 && "[&>div]:bg-red-500",
                    budgetPercent > 75 && budgetPercent <= 90 && "[&>div]:bg-yellow-500",
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {budgetPercent > 90 && "Warning: Budget utilization is high"}
                  {budgetPercent > 75 && budgetPercent <= 90 && "Caution: Approaching budget limit"}
                  {budgetPercent <= 75 && `${(100 - budgetPercent).toFixed(0)}% budget remaining`}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion Progress</span>
                  <span className="text-sm font-semibold">{project.completion}%</span>
                </div>
                <Progress value={project.completion} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Expenses</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/expenses">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projectExpenses.length > 0 ? (
                  projectExpenses.map((expense: Expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{expense.category}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold">${expense.amount.toLocaleString()}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            expense.status === "approved" && "bg-green-500/10 text-green-500",
                            expense.status === "pending" && "bg-yellow-500/10 text-yellow-500",
                            expense.status === "rejected" && "bg-red-500/10 text-red-500",
                          )}
                        >
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance Details</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/attendance">View all attendance</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Attendance Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Present Today</p>
                  <p className="text-2xl font-bold text-green-500">{presentToday}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                  <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Overtime</p>
                  <p className="text-2xl font-bold text-yellow-500">{overtimeToday}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">OT Hours</p>
                  <p className="text-2xl font-bold text-yellow-500">{totalOvertimeHours.toFixed(1)}</p>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold mb-3">Recent Records</h4>
                {projectAttendance.length > 0 ? (
                  <>
                    {/* Desktop View - Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Employee</th>
                            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Date</th>
                            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Check In</th>
                            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Check Out</th>
                            <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Hours</th>
                            <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Overtime</th>
                            <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projectAttendance.map((record: Attendance) => (
                            <tr
                              key={record.id}
                              className="border-b border-border/50 last:border-0 hover:bg-secondary/50"
                            >
                              <td className="py-3 px-2">
                                <p className="text-sm font-medium">{getEmployeeName(record)}</p>
                              </td>
                              <td className="py-3 px-2">
                                <p className="text-sm text-muted-foreground">
                                  {new Date(record.date).toLocaleDateString()}
                                </p>
                              </td>
                              <td className="py-3 px-2">
                                <p className="text-sm">{record.checkIn}</p>
                              </td>
                              <td className="py-3 px-2">
                                <p className="text-sm">{record.checkOut}</p>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <p className="text-sm font-medium">{record.hours}h</p>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <p
                                  className={cn(
                                    "text-sm font-medium",
                                    record.overtime > 0 ? "text-yellow-500" : "text-muted-foreground",
                                  )}
                                >
                                  {record.overtime > 0 ? `+${record.overtime}h` : "-"}
                                </p>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    record.status === "present" && "bg-green-500/10 text-green-500 border-green-500/20",
                                    record.status === "absent" && "bg-red-500/10 text-red-500 border-red-500/20",
                                    record.status === "half-day" &&
                                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                                    record.status === "overtime" &&
                                    "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                  )}
                                >
                                  {record.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-3">
                      {projectAttendance.map((record: Attendance) => (
                        <div key={record.id} className="p-4 rounded-lg border border-border bg-card">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-sm">{getEmployeeName(record)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                record.status === "present" && "bg-green-500/10 text-green-500 border-green-500/20",
                                record.status === "absent" && "bg-red-500/10 text-red-500 border-red-500/20",
                                record.status === "half-day" && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                                record.status === "overtime" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                              )}
                            >
                              {record.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Check In</p>
                              <p className="font-medium">{record.checkIn}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Check Out</p>
                              <p className="font-medium">{record.checkOut}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Hours Worked</p>
                              <p className="font-semibold">{record.hours}h</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Overtime</p>
                              <p
                                className={cn(
                                  "font-semibold",
                                  record.overtime > 0 ? "text-yellow-500" : "text-muted-foreground",
                                )}
                              >
                                {record.overtime > 0 ? `+${record.overtime}h` : "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No attendance records found for this project</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Manager */}
          <Card>
            <CardHeader>
              <CardTitle>Project Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {project.manager
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{project.manager}</p>
                  <p className="text-sm text-muted-foreground">Site Manager</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{projectEmployees.length}</span>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary" onClick={() => setShowManageMembers(true)}>
                    Manage Team
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projectEmployees.length > 0 ? (
                  projectEmployees.slice(0, 5).map((employee: Employee) => (
                    <div key={employee.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-secondary text-xs">
                          {employee.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No team members assigned</p>
                )}
                {projectEmployees.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/employees">View all {projectEmployees.length} members</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Present Today</span>
                  <span className="font-semibold text-green-500">{presentToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overtime Workers</span>
                  <span className="font-semibold text-yellow-500">{overtimeToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Records</span>
                  <span className="font-semibold">{projectAttendance.length}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total Hours</span>
                  <span className="font-semibold text-primary">{totalHours.toFixed(1)}h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Project Dialog */}
      {project && (
        <EditProjectDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          project={project}
          onSaveSuccess={refreshProject}
        />
      )}

      {/* Mark Attendance Dialog */}
      <MarkAttendanceDialog
        open={showMarkAttendance}
        onOpenChange={setShowMarkAttendance}
        projectId={id}
        onSaveSuccess={() => {
          refreshAttendance()
          refreshProject()
        }}
      />

      {/* Manage Members Dialog */}
      <ManageMembersDialog
        open={showManageMembers}
        onOpenChange={setShowManageMembers}
        projectId={id}
        onSaveSuccess={() => {
          refreshProject()
          refreshEmployees?.()
        }}
      />

      {/* Process Payroll Dialog */}
      <ProcessPayrollDialog
        open={showProcessPayroll}
        onOpenChange={setShowProcessPayroll}
        initialProjectId={id}
        onSaveSuccess={() => {
          refreshProject()
        }}
      />
    </div>
  )
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ProjectDetailContent id={id} />
    </Suspense>
  )
}
