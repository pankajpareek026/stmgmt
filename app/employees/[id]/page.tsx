"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Edit,
  MoreVertical,
  Briefcase,
  MapPin,
  Clock,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useApi } from "@/hooks/use-api"
import { Employee, Project, Attendance, Payroll } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api-service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { EditEmployeeDialog } from "@/components/edit-employee-dialog"
import { MarkEmployeeAttendanceDialog } from "@/components/mark-employee-attendance-dialog"
import { ProcessPayrollDialog } from "@/components/process-payroll-dialog"
import { AttendanceCalendar } from "@/components/attendance-calendar"
import { AssignProjectDialog } from "@/components/assign-project-dialog"

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  "on-leave": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
  const [showPayrollDialog, setShowPayrollDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  const { data: employee, loading, error, refresh: refreshEmployee } = useApi<Employee>(`/employees/${id}`)
  const { data: projects } = useApi<Project[]>("/projects")
  const { data: attendanceData, refresh: refreshAttendance } = useApi<Attendance[]>("/attendance")
  const { data: payrollData, refresh: refreshPayroll } = useApi<Payroll[]>("/payroll")
  const { data: projectStats, refresh: refreshStats } = useApi<any[]>(`/employees/${id}/stats`)

  const [selectedProcessProjectId, setSelectedProcessProjectId] = useState<string | undefined>(undefined)

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await apiService.delete(`/employees/${id}`)
        toast.success("Employee deleted successfully")
        router.push("/employees")
      } catch (err) {
        toast.error("Failed to delete employee")
        console.error(err)
      }
    }
  }

  if (loading && !employee) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading employee details...</span>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Employee Not Found</h2>
        <p className="text-muted-foreground mb-4">{error || "The employee you're looking for doesn't exist"}</p>
        <Button asChild>
          <Link href="/employees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Link>
        </Button>
      </div>
    )
  }

  const assignedProjects = (projects || []).filter((p: Project) =>
    employee.projectIds?.includes(p.id)
  )

  const displayProjects = assignedProjects.length > 0 ? assignedProjects : []

  // Use the first project for default actions, or undefined if none
  const defaultProjectId = employee.projectIds?.[0]

  const employeeAttendance = (attendanceData || []).filter((a: any) => {
    const empId = typeof a.employeeId === 'string' ? a.employeeId : (a.employeeId?._id || a.employeeId?.id);
    return empId === id;
  });

  const employeePayrollDocs = (payrollData || []).filter((p: any) => {
    const empId = typeof p.employeeId === 'string' ? p.employeeId : (p.employeeId?._id || p.employeeId?.id);
    return empId === id;
  });

  const employeeTransactions = employeePayrollDocs.flatMap((doc: any) =>
    (doc.payments || []).map((p: any) => ({
      ...p,
      id: p._id || p.id,
      status: doc.status,
      period: doc.period
    }))
  ).sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())

  // Helper function to get project initials
  const getProjectInitials = (projectName: string): string => {
    if (!projectName) return 'GEN'
    return projectName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0].toUpperCase())
      .slice(0, 3)
      .join('')
  }

  // Helper function to assign consistent colors to projects
  const projectColorMap = new Map<string, string>()
  const projectColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1']
  const getProjectColor = (projectId: string): string => {
    if (!projectId) return '#6b7280'
    if (!projectColorMap.has(projectId)) {
      const colorIndex = projectColorMap.size % projectColors.length
      projectColorMap.set(projectId, projectColors[colorIndex])
    }
    return projectColorMap.get(projectId) || '#6b7280'
  }

  // Helper function to find payment for a specific date and project
  const findPaymentForDate = (date: string, projectId: string): number | undefined => {
    const dateStr = new Date(date).toISOString().split('T')[0]
    for (const transaction of employeeTransactions) {
      const paymentDateStr = new Date(transaction.paymentDate).toISOString().split('T')[0]
      const txProjectId = typeof transaction.projectId === 'string'
        ? transaction.projectId
        : (transaction.projectId?._id || transaction.projectId?.id)

      if (paymentDateStr === dateStr && txProjectId === projectId) {
        return transaction.amount
      }
    }
    return undefined
  }

  // Enrich attendance data with payment information
  const enrichedAttendance = employeeAttendance.map((attendance: any) => {
    const attProjectId = typeof attendance.projectId === 'string'
      ? attendance.projectId
      : (attendance.projectId?._id || attendance.projectId?.id)

    const project = (projects || []).find((p: Project) => p.id === attProjectId)
    const projectName = project?.name || attendance.projectName || 'General'

    return {
      ...attendance,
      projectId: attProjectId,
      projectName,
      projectInitials: getProjectInitials(projectName),
      projectColor: getProjectColor(attProjectId || 'general'),
      paymentAmount: findPaymentForDate(attendance.date, attProjectId)
    }
  })

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-2">
        <Link href="/employees">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Link>
      </Button>

      {/* Employee Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {employee.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{employee.name}</h1>
              <Badge variant="outline" className={cn(statusColors[employee.status as keyof typeof statusColors])}>
                {employee.status}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">{employee.role}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button onClick={() => setShowAttendanceDialog(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
          <Button
            variant="secondary"
            className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
            onClick={() => {
              setSelectedProcessProjectId(defaultProjectId)
              setShowPayrollDialog(true)
            }}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Process Payroll
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact & Details */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Earned Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-xl font-bold">
                  ₹{employeeAttendance.reduce((sum: number, a: any) => {
                    const dailyRate = employee.dailyRate || 0;
                    if (a.status === 'present') return sum + dailyRate;
                    if (a.status === 'half-day') return sum + (dailyRate / 2);
                    return sum;
                  }, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paid Amount Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="text-xl font-bold">
                  ₹{employeePayrollDocs.reduce((sum: number, p: any) => sum + (p.totalPaid || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Due Card */}
        <Card>
          {(() => {
            const totalEarned = employeeAttendance.reduce((sum: number, a: any) => {
              const dailyRate = employee.dailyRate || 0;
              if (a.status === 'present') return sum + dailyRate;
              if (a.status === 'half-day') return sum + (dailyRate / 2);
              return sum;
            }, 0);
            const totalPaid = employeePayrollDocs.reduce((sum: number, p: any) => sum + (p.totalPaid || 0), 0);
            const remaining = totalEarned - totalPaid;

            return (
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Due</p>
                    <p className="text-xl font-bold">₹{remaining.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            );
          })()}
        </Card>

        {/* Daily Rate Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Rate</p>
                <p className="text-xl font-bold">₹{employee.dailyRate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">


          {/* Project-wise Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Balance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectStats && projectStats.length > 0 ? (
                  projectStats.map((stat: any) => (
                    <div key={stat.projectId} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                          <h4 className="font-bold text-base">{stat.projectName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {stat.attendanceCount} days worked • {stat.totalHours}h total
                          </p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "w-fit",
                          stat.netDue > 0 ? "bg-red-500/10 text-red-600 border-red-200" : "bg-green-500/10 text-green-600 border-green-200"
                        )}>
                          {stat.netDue > 0 ? `Net Due: ₹${stat.netDue.toLocaleString()}` : "Fully Paid"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-border/50">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">Total Earned</p>
                          <p className="text-lg font-bold text-blue-600">₹{stat.totalEarned.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">Paid So Far</p>
                          <p className="text-lg font-bold text-green-600">₹{stat.totalPaid.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-border/10">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-[11px] hover:text-primary transition-colors"
                          onClick={() => {
                            setSelectedProcessProjectId(stat.projectId === 'general' ? undefined : stat.projectId)
                            setShowPayrollDialog(true)
                          }}
                        >
                          <DollarSign className="h-3 w-3 mr-1" /> Pay Due
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-[11px] hover:text-primary transition-colors"
                          onClick={() => {
                            setSelectedProcessProjectId(stat.projectId === 'general' ? undefined : stat.projectId)
                            setShowAttendanceDialog(true)
                          }}
                        >
                          <Clock className="h-3 w-3 mr-1" /> Mark
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6 italic">
                    No project-specific data available yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Attendance Calendar</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/attendance">View all logs</Link>
              </Button>
            </div>
            <AttendanceCalendar records={enrichedAttendance} />
          </div>

          {/* Attendance Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance Records</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {employeeAttendance.length} total records
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {employeeAttendance.length > 0 ? (
                <>
                  {/* Desktop View - Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Project</th>
                          <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Check In</th>
                          <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Check Out</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Hours</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Overtime</th>
                          <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrichedAttendance.map((record: any) => (
                          <tr
                            key={record.id}
                            className="border-b border-border/50 last:border-0 hover:bg-secondary/50"
                          >
                            <td className="py-3 px-2">
                              <p className="text-sm font-medium">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{ backgroundColor: record.projectColor }}
                                >
                                  {record.projectInitials}
                                </div>
                                <p className="text-sm font-medium truncate max-w-[200px]">
                                  {record.projectName}
                                </p>
                              </div>
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
                                  record.status === "half-day" && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                                  record.status === "overtime" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
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
                    {enrichedAttendance.map((record: any) => (
                      <div key={record.id} className="p-4 rounded-lg border border-border bg-card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: record.projectColor }}
                            >
                              {record.projectInitials}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {record.projectName}
                              </p>
                            </div>
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
                  <p className="text-sm text-muted-foreground">No attendance records found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payroll History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payroll History</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/payroll">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeTransactions.length > 0 ? (
                  employeeTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        {/* Display Payment Date or Period */}
                        <p className="text-sm font-medium">
                          {new Date(tx.paymentDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        {/* Display Project Name and Optional Description */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] py-0 px-1 bg-muted/50 font-normal">
                            {tx.projectId?.name || tx.projectName || "General"}
                          </Badge>
                          <p className="text-xs text-muted-foreground capitalize">
                            {tx.period} {tx.description ? `- ${tx.description}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">₹{tx.amount.toLocaleString()}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            tx.status === "paid" && "bg-green-500/10 text-green-500",
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No payroll recordsfound</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Project Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {displayProjects.length > 0 ? (
                <div className="space-y-4">
                  {displayProjects.map((project: Project) => (
                    <div key={project.id} className="p-3 rounded-lg border border-border space-y-3">
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-semibold">{project.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{project.completion}% complete</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <p className="text-sm truncate">{project.location}</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                        <Link href={`/projects/${project.id}`}>View Project</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No active assignments</p>
              )}
            </CardContent>
          </Card>

          {/* Work Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Work Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Days Worked</span>
                  <span className="font-bold">
                    {employeeAttendance.filter((a: any) => a.status === 'present' || a.status === 'half-day').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Earned (Approx)</span>
                  <span className="font-bold">
                    ₹{employeeAttendance.reduce((sum: number, a: any) => {
                      const dailyRate = employee.dailyRate || 0;
                      if (a.status === 'present') return sum + dailyRate;
                      if (a.status === 'half-day') return sum + (dailyRate / 2);
                      return sum;
                    }, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid So Far</span>
                  <span className="font-bold text-green-600">
                    ₹{employeePayrollDocs.reduce((sum: number, p: any) => sum + (p.totalPaid || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overtime Hours</span>
                  <span className="font-bold">{employeeAttendance.reduce((sum: number, a: Attendance) => sum + a.overtime, 0)}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent hover:text-primary border-border/50 hover:border-primary/50 transition-colors"
                size="sm"
                onClick={() => setShowAttendanceDialog(true)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent hover:text-primary border-border/50 hover:border-primary/50 transition-colors"
                size="sm"
                onClick={() => setShowPayrollDialog(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payroll
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent hover:text-primary border-border/50 hover:border-primary/50 transition-colors"
                size="sm"
                onClick={() => setShowAssignDialog(true)}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Assign to Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {employee && (
        <EditEmployeeDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          employee={employee}
          onSaveSuccess={refreshEmployee}
        />
      )}

      {employee && (
        <MarkEmployeeAttendanceDialog
          open={showAttendanceDialog}
          onOpenChange={setShowAttendanceDialog}
          employee={employee}
          currentProjectId={selectedProcessProjectId || defaultProjectId}
          onSaveSuccess={() => {
            refreshAttendance()
            refreshEmployee()
            refreshStats()
          }}
        />
      )}
      {employee && (
        <ProcessPayrollDialog
          open={showPayrollDialog}
          onOpenChange={setShowPayrollDialog}
          initialEmployeeId={employee.id || (employee as any)._id}
          initialProjectId={selectedProcessProjectId}
          onSaveSuccess={() => {
            refreshPayroll()
            refreshEmployee()
            refreshStats()
          }}
        />
      )}
      {employee && (
        <AssignProjectDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          employee={employee}
          onSaveSuccess={() => {
            refreshEmployee()
            refreshStats()
          }}
        />
      )}
    </div>
  )
}
