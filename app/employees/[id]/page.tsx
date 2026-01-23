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

  const { data: employee, loading, error, refresh: refreshEmployee } = useApi<Employee>(`/employees/${id}`)
  const { data: projects } = useApi<Project[]>("/projects")
  const { data: attendanceData, refresh: refreshAttendance } = useApi<Attendance[]>("/attendance")
  const { data: payrollData, refresh: refreshPayroll } = useApi<Payroll[]>("/payroll")

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

  if (loading) {
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

  const employeeProjectId = typeof employee.projectId === 'object' && employee.projectId !== null
    ? (employee.projectId as any).id
    : employee.projectId

  const assignedProject = (projects || []).find((p: Project) => p.id === employeeProjectId)
  // Fallback: If project not found in list but we have populated data, use that
  const displayProject = assignedProject || (typeof employee.projectId === 'object' ? employee.projectId : null)
  const employeeAttendance = (attendanceData || []).filter((a: any) => {
    const empId = typeof a.employeeId === 'string' ? a.employeeId : (a.employeeId?._id || a.employeeId?.id);
    return empId === id;
  });
  const employeePayroll = (payrollData || []).filter((p: any) => {
    const empId = typeof p.employeeId === 'string' ? p.employeeId : (p.employeeId?._id || p.employeeId?.id);
    return empId === id;
  });

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
            onClick={() => setShowPayrollDialog(true)}
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
                  ₹{employeePayroll.reduce((sum: number, p: Payroll) => sum + p.netPay, 0).toLocaleString()}
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
            const totalPaid = employeePayroll.reduce((sum: number, p: Payroll) => sum + p.netPay, 0);
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
          {/* Skills & Information */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Attendance</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/attendance">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeAttendance.length > 0 ? (
                  employeeAttendance.map((attendance: any) => (
                    <div
                      key={attendance.id || attendance._id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{new Date(attendance.date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {attendance.projectId?.name || attendance.projectName || "Unknown Project"}
                        </p>
                      </div>
                      <div className="text-right">
                        {attendance.status === 'present' ? (
                          <>
                            <p className="text-sm font-semibold">
                              {attendance.checkIn} - {attendance.checkOut || "?"}
                            </p>
                            <p className="text-xs text-muted-foreground">{attendance.hours}h worked</p>
                          </>
                        ) : (
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            attendance.status === 'absent' && "text-red-500 border-red-200 bg-red-50",
                            attendance.status === 'half-day' && "text-yellow-500 border-yellow-200 bg-yellow-50"
                          )}>
                            {attendance.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No attendance records</p>
                )}
              </div>
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
                {employeePayroll.length > 0 ? (
                  employeePayroll.map((payroll: any) => (
                    <div
                      key={payroll.id || payroll._id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        {/* Display Payment Date or Period */}
                        <p className="text-sm font-medium">
                          {payroll.paymentDate
                            ? new Date(payroll.paymentDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                            : (payroll.period || "Unknown Date")}
                        </p>
                        {/* Display Payment Type and Optional Description */}
                        <p className="text-xs text-muted-foreground capitalize">
                          {payroll.paymentType || "Salary"} {payroll.description ? `- ${payroll.description}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">₹{payroll.netPay.toLocaleString()}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            payroll.status === "paid" && "bg-green-500/10 text-green-500",
                            payroll.status === "pending" && "bg-yellow-500/10 text-yellow-500",
                            payroll.status === "processing" && "bg-blue-500/10 text-blue-500",
                          )}
                        >
                          {payroll.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No payroll records</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Assignment */}
          {displayProject ? (
            <Card>
              <CardHeader>
                <CardTitle>Current Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold">{displayProject.name}</p>
                      {/* Only show completion/location if we have the full project object from the list */}
                      {assignedProject && (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">{assignedProject.completion}% complete</p>
                        </>
                      )}
                    </div>
                  </div>
                  {assignedProject && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{assignedProject.location}</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent" asChild>
                    <Link href={`/projects/${displayProject.id || (displayProject as any)._id}`}>View Project</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Current Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">No active assignment</p>
              </CardContent>
            </Card>
          )}

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
                    ₹{employeePayroll.reduce((sum: number, p: Payroll) => sum + p.netPay, 0).toLocaleString()}
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
                className="w-full justify-start bg-transparent"
                size="sm"
                onClick={() => setShowAttendanceDialog(true)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payroll
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
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
          currentProjectId={typeof employee.projectId === 'string' ? employee.projectId : (employee.projectId as any)?.id}
          onSaveSuccess={() => {
            refreshAttendance()
            refreshEmployee()
          }}
        />
      )}
      {employee && (
        <ProcessPayrollDialog
          open={showPayrollDialog}
          onOpenChange={setShowPayrollDialog}
          initialEmployeeId={employee.id || (employee as any)._id}
          onSaveSuccess={() => {
            refreshPayroll()
            refreshEmployee()
          }}
        />
      )}
    </div>
  )
}
