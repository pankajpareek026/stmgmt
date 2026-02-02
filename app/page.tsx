"use client"

import { DollarSign, Users, FolderKanban, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { ProjectStatusCard } from "@/components/project-status-card"
import { RecentActivity } from "@/components/recent-activity"
import { useApi } from "@/hooks/use-api"
import { Project, Employee, Attendance, Payroll, Expense } from "@/lib/mock-data"
import { useCurrency } from "@/components/currency-provider"

export default function DashboardPage() {
  const { formatCompact } = useCurrency()
  const { data: projects, loading: projectsLoading, error: projectsError } = useApi<Project[]>("/projects")
  const { data: employees, loading: employeesLoading, error: employeesError } = useApi<Employee[]>("/employees")
  const { data: attendance, loading: attendanceLoading } = useApi<Attendance[]>("/attendance")
  const { data: payroll } = useApi<Payroll[]>("/payroll")
  const { data: expenses } = useApi<Expense[]>("/expenses")

  if (projectsLoading || employeesLoading || attendanceLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard data...</span>
      </div>
    )
  }

  if (projectsError || employeesError) {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 text-destructive text-center">
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p>{projectsError || employeesError}</p>
      </div>
    )
  }

  // Calculate KPIs from API data
  const safeProjects = projects || []
  const safeEmployees = employees || []

  const activeProjectsData = (projects || []).filter((p: Project) => p.status === "active")
  const activeProjectsCount = activeProjectsData.length
  const totalEmployees = safeEmployees.length
  const activeEmployees = safeEmployees.filter((e: Employee) => e.status === "active").length
  const totalBudget = safeProjects.reduce((sum: number, p: Project) => sum + p.budget, 0)
  const totalSpent = safeProjects.reduce((sum: number, p: Project) => sum + p.spent, 0)
  const avgCompletion = safeProjects.length > 0
    ? safeProjects.reduce((sum: number, p: Project) => sum + p.completion, 0) / safeProjects.length
    : 0

  // Today's Attendance Calculation
  const today = new Date().toISOString().split("T")[0]
  const todaysAttendance = (attendance || []).filter((a: Attendance) => {
    const recordDate = new Date(a.date).toISOString().split("T")[0]
    return recordDate === today
  })
  const checkedIn = todaysAttendance.filter((a: Attendance) => a.status === "present" || a.status === "half-day" || a.status === "overtime").length
  const onLeave = safeEmployees.filter((e: Employee) => e.status === "on-leave").length
  const absent = todaysAttendance.filter((a: Attendance) => a.status === "absent").length

  // Attention Required
  const pendingExpenses = (expenses || []).filter((e: Expense) => e.status === "pending").length
  const projectOnHold = safeProjects.filter((p: Project) => p.status === "on-hold").length
  const pendingPayroll = (payroll || []).filter((p: Payroll) => p.status === "pending").length

  // Dynamic Activities
  const generatedActivities: any[] = []

  // Project activities
  safeProjects.slice(0, 5).forEach((p: Project) => {
    generatedActivities.push({
      id: `p-${p.id}`,
      type: "project",
      message: `${p.name} at ${p.location} is ${p.status}`,
      time: "Recent",
    })
  })

  // Employee activities
  safeEmployees.slice(-5).forEach((e: Employee) => {
    generatedActivities.push({
      id: `e-${e.id}`,
      type: "employee",
      message: `New employee ${e.name} joined as ${e.role}`,
      time: "Recent",
      user: (e.name || "Unknown").split(" ").map(n => n[0]).join(""),
    })
  })

  // Attendance activities
  todaysAttendance.slice(0, 5).forEach((a: Attendance) => {
    generatedActivities.push({
      id: `a-${a.id}`,
      type: "attendance",
      message: `${a.employeeName || "Worker"} checked in - ${a.status}`,
      time: "Today",
      user: (a.employeeName || "Unknown").split(" ").map(n => n[0]).join(""),
    })
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your construction workforce operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={activeProjectsCount}
          change={`Across ${safeProjects.length} total`}
          changeType="neutral"
          icon={FolderKanban}
        />
        <StatCard
          title="Total Employees"
          value={activeEmployees}
          change={`${totalEmployees} total`}
          changeType="neutral"
          icon={Users}
        />
        <StatCard
          title="Budget Utilization"
          value={`${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%`}
          change={`${formatCompact(totalSpent)} of ${formatCompact(totalBudget)}`}
          changeType="neutral"
          icon={DollarSign}
        />
        <StatCard
          title="Avg Completion"
          value={`${avgCompletion.toFixed(0)}%`}
          change="+5% from last week"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Active Projects Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
          <a href="/projects" className="text-sm text-primary hover:underline">
            View all
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {safeProjects
            .filter((p: Project) => p.status === "active")
            .map((project: Project) => (
              <ProjectStatusCard key={project.id} project={project} />
            ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity activities={generatedActivities.sort(() => Math.random() - 0.5).slice(0, 5)} />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <h3 className="font-semibold">Attention Required</h3>
            </div>
            <div className="space-y-3">
              {projectOnHold > 0 && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{projectOnHold} Projects On Hold</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Projects requiring review</p>
                  </div>
                </div>
              )}
              {pendingExpenses > 0 && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{pendingExpenses} Pending Approvals</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Expense reports awaiting review</p>
                  </div>
                </div>
              )}
              {pendingPayroll > 0 && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">Payroll Due</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Process payroll for {activeEmployees} workers</p>
                  </div>
                </div>
              )}
              {projectOnHold === 0 && pendingExpenses === 0 && pendingPayroll === 0 && (
                <p className="text-sm text-muted-foreground">All systems clear. No immediate attention needed.</p>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Today's Attendance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Checked In</span>
                <span className="font-semibold text-green-500">{checkedIn}/{activeEmployees}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On Leave</span>
                <span className="font-semibold text-yellow-500">{onLeave}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Absent</span>
                <span className="font-semibold text-red-500">{absent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
