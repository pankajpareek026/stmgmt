
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
import { useCurrency } from "@/components/currency-provider"

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "on-hold": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  planning: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

function ProjectDetailContent({ id }: { id: string }) {
  const { formatCurrency, formatCompact } = useCurrency()
  const router = useRouter()
  const [showMarkAttendance, setShowMarkAttendance] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showManageMembers, setShowManageMembers] = useState(false)
  const [showProcessPayroll, setShowProcessPayroll] = useState(false)

  const { data: project, loading, error, refresh: refreshProject } = useApi<Project>(`/projects/${id}`)
  const { data: employeesData, refresh: refreshEmployees } = useApi<Employee[]>("/employees")
  const { data: expensesData, refresh: refreshExpenses } = useApi<Expense[]>("/expenses")
  const { data: attendanceData, refresh: refreshAttendance } = useApi<Attendance[]>("/attendance")
  const { data: payrollData } = useApi<any[]>("/payroll")

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

  const formatDayCount = (value: number) => (Number.isInteger(value) ? `${value}` : value.toFixed(1))

  // Use the calculated spent value from API (sum of approved expenses)
  const totalSpend = project.spent || 0
  const budgetPercent = project.budget > 0 ? (totalSpend / project.budget) * 100 : 0

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

  // Calculate total project payments and earnings
  const projectTotalEarned = projectEmployees.reduce((sum, emp) => {
    const empId = emp.id || (emp as any)._id;
    const empAtt = projectAttendance.filter((att: any) => {
      const attEmpId = typeof att.employeeId === 'object' && att.employeeId !== null
        ? (att.employeeId as any)._id || (att.employeeId as any).id
        : att.employeeId;
      return attEmpId === empId;
    });
    return sum + empAtt.reduce((s: number, att: any) => {
      const rate = emp.dailyRate || 0;
      if (att.status === 'present') return s + rate;
      if (att.status === 'half-day') return s + (rate / 2);
      return s;
    }, 0);
  }, 0);

  const projectTotalPaid = projectEmployees.reduce((sum, emp) => {
    const empId = emp.id || (emp as any)._id;
    let paid = 0;
    if (payrollData && payrollData.length > 0) {
      payrollData.forEach((p: any) => {
        const pEmpId = typeof p.employeeId === 'object' && p.employeeId !== null
          ? (p.employeeId as any)._id || (p.employeeId as any).id
          : p.employeeId;
        if (pEmpId === empId && p.payments) {
          p.payments.forEach((pay: any) => {
            const pProjId = typeof pay.projectId === 'object' && pay.projectId !== null
              ? (pay.projectId as any)._id || (pay.projectId as any).id
              : pay.projectId;
            if (pProjId === id || !pProjId) {
              paid += pay.amount || 0;
            }
          });
        }
      });
    }
    return sum + paid;
  }, 0);

  const projectTotalPending = Math.max(0, projectTotalEarned - projectTotalPaid);

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
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
                <p className="text-2xl font-bold">{formatCompact(project.budget)}</p>
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
                <p className="text-sm text-muted-foreground">Payroll Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCompact(projectTotalPaid)}</p>
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <DollarSign className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payroll Pending</p>
                <p className="text-2xl font-bold text-orange-600">{formatCompact(projectTotalPending)}</p>
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
                    {formatCompact(totalSpend)} / {formatCompact(project.budget)}
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
                        <p className="text-sm font-semibold">{formatCurrency(expense.amount)}</p>
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

          {/* Employee Payment & Attendance Tracking */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment & Attendance Tracking</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/payroll">View payroll</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectEmployees.length > 0 ? (
                <>
                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Employee</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Attendance Days</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Total Earned</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Total Paid</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Pending Days</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectEmployees.map((employee: Employee) => {
                          const empId = employee.id || (employee as any)._id;

                          // Calculate attendance count for this employee on this project
                          const employeeAttendance = projectAttendance.filter((att: any) => {
                            const attEmpId = typeof att.employeeId === 'object' && att.employeeId !== null
                              ? (att.employeeId as any)._id || (att.employeeId as any).id
                              : att.employeeId;
                            return attEmpId === empId;
                          });

                          const attendanceDays = employeeAttendance.length;
                          const attendanceUnits = employeeAttendance.reduce((sum: number, att: any) => {
                            if (att.status === 'present') return sum + 1;
                            if (att.status === 'half-day') return sum + 0.5;
                            return sum;
                          }, 0);

                          // Calculate total earned based on attendance and daily rate
                          const totalEarned = employeeAttendance.reduce((sum: number, att: any) => {
                            const dailyRate = employee.dailyRate || 0;
                            if (att.status === 'present') return sum + dailyRate;
                            if (att.status === 'half-day') return sum + (dailyRate / 2);
                            return sum;
                          }, 0);

                          // Calculate total paid for this employee on this project
                          let totalPaid = 0;
                          if (payrollData && payrollData.length > 0) {
                            payrollData.forEach((payroll: any) => {
                              const payrollEmpId = typeof payroll.employeeId === 'object' && payroll.employeeId !== null
                                ? (payroll.employeeId as any)._id || (payroll.employeeId as any).id
                                : payroll.employeeId;

                              if (payrollEmpId === empId && payroll.payments) {
                                payroll.payments.forEach((payment: any) => {
                                  const paymentProjId = typeof payment.projectId === 'object' && payment.projectId !== null
                                    ? (payment.projectId as any)._id || (payment.projectId as any).id
                                    : payment.projectId;

                                  // Include project-specific payments and general payments (no projectId)
                                  if (paymentProjId === id || !paymentProjId) {
                                    totalPaid += payment.amount || 0;
                                  }
                                });
                              }
                            });
                          }

                          const pendingAmount = Math.max(0, totalEarned - totalPaid);
                          const dailyRate = employee.dailyRate || 0;
                          const paidUnits = dailyRate > 0 ? totalPaid / dailyRate : 0;
                          const pendingUnits = Math.max(0, attendanceUnits - paidUnits);

                          return (
                            <tr
                              key={empId}
                              className="border-b border-border/50 last:border-0 hover:bg-secondary/50"
                            >
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-secondary text-xs">
                                      {employee.name.split(" ").map((n: string) => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{employee.name}</p>
                                    <p className="text-xs text-muted-foreground">{employee.role}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <p className="text-sm font-medium">{attendanceDays}</p>
                                <p className="text-xs text-muted-foreground">days</p>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <p className="text-sm font-medium text-blue-600">{formatCurrency(totalEarned)}</p>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <p className="text-sm font-medium text-green-600">{formatCurrency(totalPaid)}</p>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <p className={cn(
                                  "text-sm font-medium",
                                  pendingUnits > 0 ? "text-orange-600" : "text-muted-foreground"
                                )}>
                                  {formatDayCount(pendingUnits)}
                                </p>
                                <p className="text-xs text-muted-foreground">days</p>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <p className={cn(
                                  "text-sm font-bold",
                                  pendingAmount > 0 ? "text-orange-600" : "text-muted-foreground"
                                )}>
                                  {formatCurrency(pendingAmount)}
                                </p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border font-semibold">
                          <td className="py-3 px-2 text-sm">Total</td>
                          <td className="py-3 px-2 text-right text-sm">
                            {projectAttendance.length}
                          </td>
                          <td className="py-3 px-2 text-right text-sm text-blue-600">
                            {formatCurrency(projectEmployees.reduce((sum, emp) => {
                              const empId = emp.id || (emp as any)._id;
                              const empAtt = projectAttendance.filter((att: any) => {
                                const attEmpId = typeof att.employeeId === 'object' && att.employeeId !== null
                                  ? (att.employeeId as any)._id || (att.employeeId as any).id
                                  : att.employeeId;
                                return attEmpId === empId;
                              });
                              return sum + empAtt.reduce((s: number, att: any) => {
                                const rate = emp.dailyRate || 0;
                                if (att.status === 'present') return s + rate;
                                if (att.status === 'half-day') return s + (rate / 2);
                                return s;
                              }, 0);
                            }, 0))}
                          </td>
                          <td className="py-3 px-2 text-right text-sm text-green-600">
                            {formatCurrency(projectEmployees.reduce((sum, emp) => {
                              const empId = emp.id || (emp as any)._id;
                              let paid = 0;
                              if (payrollData) {
                                payrollData.forEach((p: any) => {
                                  const pEmpId = typeof p.employeeId === 'object' ? (p.employeeId as any)._id || (p.employeeId as any).id : p.employeeId;
                                  if (pEmpId === empId && p.payments) {
                                    p.payments.forEach((pay: any) => {
                                      const pProjId = typeof pay.projectId === 'object' ? (pay.projectId as any)._id || (pay.projectId as any).id : pay.projectId;
                                      if (pProjId === id || !pProjId) paid += pay.amount || 0;
                                    });
                                  }
                                });
                              }
                              return sum + paid;
                            }, 0))}
                          </td>
                          <td className="py-3 px-2 text-right text-sm text-orange-600">
                            {formatDayCount(projectEmployees.reduce((sum, emp) => {
                              const empId = emp.id || (emp as any)._id;
                              const empAtt = projectAttendance.filter((att: any) => {
                                const attEmpId = typeof att.employeeId === 'object' ? (att.employeeId as any)._id || (att.employeeId as any).id : att.employeeId;
                                return attEmpId === empId;
                              });
                              const attendanceUnits = empAtt.reduce((s: number, att: any) => {
                                if (att.status === 'present') return s + 1;
                                if (att.status === 'half-day') return s + 0.5;
                                return s;
                              }, 0);
                              let paid = 0;
                              if (payrollData) {
                                payrollData.forEach((p: any) => {
                                  const pEmpId = typeof p.employeeId === 'object' ? (p.employeeId as any)._id || (p.employeeId as any).id : p.employeeId;
                                  if (pEmpId === empId && p.payments) {
                                    p.payments.forEach((pay: any) => {
                                      const pProjId = typeof pay.projectId === 'object' ? (pay.projectId as any)._id || (pay.projectId as any).id : pay.projectId;
                                      if (pProjId === id || !pProjId) paid += pay.amount || 0;
                                    });
                                  }
                                });
                              }
                              const rate = emp.dailyRate || 0;
                              const paidUnits = rate > 0 ? paid / rate : 0;
                              return sum + Math.max(0, attendanceUnits - paidUnits);
                            }, 0))}
                          </td>
                          <td className="py-3 px-2 text-right text-sm text-orange-600 font-bold">
                            {formatCurrency((() => {
                              const totalEarned = projectEmployees.reduce((sum, emp) => {
                                const empId = emp.id || (emp as any)._id;
                                const empAtt = projectAttendance.filter((att: any) => {
                                  const attEmpId = typeof att.employeeId === 'object' ? (att.employeeId as any)._id || (att.employeeId as any).id : att.employeeId;
                                  return attEmpId === empId;
                                });
                                return sum + empAtt.reduce((s: number, att: any) => {
                                  const rate = emp.dailyRate || 0;
                                  if (att.status === 'present') return s + rate;
                                  if (att.status === 'half-day') return s + (rate / 2);
                                  return s;
                                }, 0);
                              }, 0);
                              const totalPaid = projectEmployees.reduce((sum, emp) => {
                                const empId = emp.id || (emp as any)._id;
                                let paid = 0;
                                if (payrollData) {
                                  payrollData.forEach((p: any) => {
                                    const pEmpId = typeof p.employeeId === 'object' ? (p.employeeId as any)._id || (p.employeeId as any).id : p.employeeId;
                                    if (pEmpId === empId && p.payments) {
                                      p.payments.forEach((pay: any) => {
                                        const pProjId = typeof pay.projectId === 'object' ? (pay.projectId as any)._id || (pay.projectId as any).id : pay.projectId;
                                        if (pProjId === id || !pProjId) paid += pay.amount || 0;
                                      });
                                    }
                                  });
                                }
                                return sum + paid;
                              }, 0);
                              return Math.max(0, totalEarned - totalPaid);
                            })())}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile/Tablet View - Cards */}
                  <div className="lg:hidden space-y-3">
                    {projectEmployees.map((employee: Employee) => {
                      const empId = employee.id || (employee as any)._id;

                      const employeeAttendance = projectAttendance.filter((att: any) => {
                        const attEmpId = typeof att.employeeId === 'object' && att.employeeId !== null
                          ? (att.employeeId as any)._id || (att.employeeId as any).id
                          : att.employeeId;
                        return attEmpId === empId;
                      });
                      const attendanceUnits = employeeAttendance.reduce((sum: number, att: any) => {
                        if (att.status === 'present') return sum + 1;
                        if (att.status === 'half-day') return sum + 0.5;
                        return sum;
                      }, 0);

                      const totalEarned = employeeAttendance.reduce((sum: number, att: any) => {
                        const dailyRate = employee.dailyRate || 0;
                        if (att.status === 'present') return sum + dailyRate;
                        if (att.status === 'half-day') return sum + (dailyRate / 2);
                        return sum;
                      }, 0);

                      let totalPaid = 0;
                      if (payrollData && payrollData.length > 0) {
                        payrollData.forEach((payroll: any) => {
                          const payrollEmpId = typeof payroll.employeeId === 'object' && payroll.employeeId !== null
                            ? (payroll.employeeId as any)._id || (payroll.employeeId as any).id
                            : payroll.employeeId;

                          if (payrollEmpId === empId && payroll.payments) {
                            payroll.payments.forEach((payment: any) => {
                              const paymentProjId = typeof payment.projectId === 'object' && payment.projectId !== null
                                ? (payment.projectId as any)._id || (payment.projectId as any).id
                                : payment.projectId;

                              if (paymentProjId === id || !paymentProjId) {
                                totalPaid += payment.amount || 0;
                              }
                            });
                          }
                        });
                      }

                      const pendingAmount = Math.max(0, totalEarned - totalPaid);
                      const dailyRate = employee.dailyRate || 0;
                      const paidUnits = dailyRate > 0 ? totalPaid / dailyRate : 0;
                      const pendingUnits = Math.max(0, attendanceUnits - paidUnits);

                      return (
                        <div key={empId} className="p-4 rounded-lg border border-border bg-card">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-secondary">
                                {employee.name.split(" ").map((n: string) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-xs text-muted-foreground">{employee.role}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 rounded bg-secondary/50">
                              <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                              <p className="text-lg font-semibold">{formatDayCount(attendanceUnits)} days</p>
                            </div>
                            <div className="p-2 rounded bg-blue-500/5 border border-blue-500/20">
                              <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
                              <p className="text-lg font-semibold text-blue-600">{formatCurrency(totalEarned)}</p>
                            </div>
                            <div className="p-2 rounded bg-green-500/5 border border-green-500/20">
                              <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div className={cn(
                              "p-2 rounded border",
                              pendingUnits > 0
                                ? "bg-orange-500/5 border-orange-500/20"
                                : "bg-secondary/50 border-border"
                            )}>
                              <p className="text-xs text-muted-foreground mb-1">Pending Days</p>
                              <p className={cn(
                                "text-lg font-bold",
                                pendingUnits > 0 ? "text-orange-600" : "text-muted-foreground"
                              )}>
                                {formatDayCount(pendingUnits)} days
                              </p>
                            </div>
                            <div className={cn(
                              "p-2 rounded border",
                              pendingAmount > 0
                                ? "bg-orange-500/5 border-orange-500/20"
                                : "bg-secondary/50 border-border"
                            )}>
                              <p className="text-xs text-muted-foreground mb-1">Pending</p>
                              <p className={cn(
                                "text-lg font-bold",
                                pendingAmount > 0 ? "text-orange-600" : "text-muted-foreground"
                              )}>
                                {formatCurrency(pendingAmount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Mobile Total Summary */}
                    <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 mt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">PROJECT TOTALS</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Records</p>
                          <p className="text-lg font-semibold">{projectAttendance.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Earned</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatCurrency(projectEmployees.reduce((sum, emp) => {
                              const empId = emp.id || (emp as any)._id;
                              const empAtt = projectAttendance.filter((att: any) => {
                                const attEmpId = typeof att.employeeId === 'object' ? (att.employeeId as any)._id || (att.employeeId as any).id : att.employeeId;
                                return attEmpId === empId;
                              });
                              return sum + empAtt.reduce((s: number, att: any) => {
                                const rate = emp.dailyRate || 0;
                                if (att.status === 'present') return s + rate;
                                if (att.status === 'half-day') return s + (rate / 2);
                                return s;
                              }, 0);
                            }, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Paid</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(projectEmployees.reduce((sum, emp) => {
                              const empId = emp.id || (emp as any)._id;
                              let paid = 0;
                              if (payrollData) {
                                payrollData.forEach((p: any) => {
                                  const pEmpId = typeof p.employeeId === 'object' ? (p.employeeId as any)._id || (p.employeeId as any).id : p.employeeId;
                                  if (pEmpId === empId && p.payments) {
                                    p.payments.forEach((pay: any) => {
                                      const pProjId = typeof pay.projectId === 'object' ? (pay.projectId as any)._id || (pay.projectId as any).id : pay.projectId;
                                      if (pProjId === id || !pProjId) paid += pay.amount || 0;
                                    });
                                  }
                                });
                              }
                              return sum + paid;
                            }, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pending Days</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {formatDayCount(projectEmployees.reduce((sum, emp) => {
                              const empId = emp.id || (emp as any)._id;
                              const empAtt = projectAttendance.filter((att: any) => {
                                const attEmpId = typeof att.employeeId === 'object' ? (att.employeeId as any)._id || (att.employeeId as any).id : att.employeeId;
                                return attEmpId === empId;
                              });
                              const attendanceUnits = empAtt.reduce((s: number, att: any) => {
                                if (att.status === 'present') return s + 1;
                                if (att.status === 'half-day') return s + 0.5;
                                return s;
                              }, 0);
                              let paid = 0;
                              if (payrollData) {
                                payrollData.forEach((p: any) => {
                                  const pEmpId = typeof p.employeeId === 'object' ? (p.employeeId as any)._id || (p.employeeId as any).id : p.employeeId;
                                  if (pEmpId === empId && p.payments) {
                                    p.payments.forEach((pay: any) => {
                                      const pProjId = typeof pay.projectId === 'object' ? (pay.projectId as any)._id || (pay.projectId as any).id : pay.projectId;
                                      if (pProjId === id || !pProjId) paid += pay.amount || 0;
                                    });
                                  }
                                });
                              }
                              const rate = emp.dailyRate || 0;
                              const paidUnits = rate > 0 ? paid / rate : 0;
                              return sum + Math.max(0, attendanceUnits - paidUnits);
                            }, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Pending</p>
                          <p className="text-lg font-bold text-orange-600">
                            {formatCurrency((() => {
                              const totalEarned = projectEmployees.reduce((sum, emp) => {
                                const empId = emp.id || (emp as any)._id;
                                const empAtt = projectAttendance.filter((att: any) => {
                                  const attEmpId = typeof att.employeeId === 'object' ? (att.employeeId as any)._id || (att.employeeId as any).id : att.employeeId;
                                  return attEmpId === empId;
                                });
                                return sum + empAtt.reduce((s: number, att: any) => {
                                  const rate = emp.dailyRate || 0;
                                  if (att.status === 'present') return s + rate;
                                  if (att.status === 'half-day') return s + (rate / 2);
                                  return s;
                                }, 0);
                              }, 0);
                              const totalPaid = projectEmployees.reduce((sum, emp) => {
                                const empId = emp.id || (emp as any)._id;
                                let paid = 0;
                                if (payrollData) {
                                  payrollData.forEach((p: any) => {
                                    const pEmpId = typeof p.employeeId === 'object' ? (p.employeeId as any)._id || (p.employeeId as any).id : p.employeeId;
                                    if (pEmpId === empId && p.payments) {
                                      p.payments.forEach((pay: any) => {
                                        const pProjId = typeof pay.projectId === 'object' ? (pay.projectId as any)._id || (pay.projectId as any).id : pay.projectId;
                                        if (pProjId === id || !pProjId) paid += pay.amount || 0;
                                      });
                                    }
                                  });
                                }
                                return sum + paid;
                              }, 0);
                              return Math.max(0, totalEarned - totalPaid);
                            })())}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No team members assigned to this project</p>
                </div>
              )}
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
