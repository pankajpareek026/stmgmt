"use client"

import { Suspense, useState } from "react"
import { Plus, Search, CalendarIcon, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useApi } from "@/hooks/use-api"
import { Project, Attendance } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { MarkAttendanceDialog } from "@/components/mark-attendance-dialog"

function AttendanceContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [showMarkAttendance, setShowMarkAttendance] = useState(false)

  const { data: attendanceData, loading: attendanceLoading, error: attendanceError, refresh: refreshAttendance } = useApi<Attendance[]>("/attendance")
  const { data: projectsData, loading: projectsLoading } = useApi<Project[]>("/projects")

  if (attendanceLoading || projectsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading attendance data...</span>
      </div>
    )
  }

  if (attendanceError) {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 text-destructive text-center">
        <h2 className="text-xl font-bold mb-2">Error Loading Attendance</h2>
        <p>{attendanceError}</p>
      </div>
    )
  }

  const safeAttendance = attendanceData || []
  const safeProjects = projectsData || []

  const filteredAttendance = safeAttendance.filter((attendance: Attendance) => {
    const matchesSearch =
      attendance.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendance.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || attendance.status === statusFilter
    const matchesProject = projectFilter === "all" || attendance.projectId === projectFilter
    return matchesSearch && matchesStatus && matchesProject
  })

  const totalHours = filteredAttendance.reduce((sum: number, a: Attendance) => sum + a.hours, 0)
  const totalOvertime = filteredAttendance.reduce((sum: number, a: Attendance) => sum + a.overtime, 0)
  const presentCount = filteredAttendance.filter((a: Attendance) => a.status === "present" || a.status === "overtime").length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track employee attendance and work hours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="sm:w-auto bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="sm:w-auto" onClick={() => setShowMarkAttendance(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CalendarIcon className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold">{presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overtime</p>
                <p className="text-2xl font-bold">{totalOvertime.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <CalendarIcon className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                <p className="text-2xl font-bold">
                  {filteredAttendance.length > 0 ? (totalHours / filteredAttendance.length).toFixed(1) : 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee or project..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="half-day">Half Day</SelectItem>
              <SelectItem value="overtime">Overtime</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {safeProjects.map((project: Project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attendance Table - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((attendance: Attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {attendance.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{attendance.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{attendance.projectName}</TableCell>
                    <TableCell>{new Date(attendance.date).toLocaleDateString()}</TableCell>
                    <TableCell>{attendance.checkIn}</TableCell>
                    <TableCell>{attendance.checkOut}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{attendance.hours}h</span>
                      {attendance.overtime > 0 && (
                        <span className="text-xs text-primary ml-1">(+{attendance.overtime}h OT)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusColors[attendance.status as keyof typeof statusColors])}>
                        {attendance.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No attendance records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attendance Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredAttendance.length > 0 ? (
          filteredAttendance.map((attendance: Attendance) => (
            <Card key={attendance.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {attendance.employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{attendance.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{attendance.projectName}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(statusColors[attendance.status as keyof typeof statusColors])}>
                    {attendance.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Date</p>
                    <p className="font-medium">{new Date(attendance.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Hours</p>
                    <p className="font-semibold">
                      {attendance.hours}h
                      {attendance.overtime > 0 && <span className="text-primary ml-1">(+{attendance.overtime}h)</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Check In</p>
                    <p className="font-medium">{attendance.checkIn}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Check Out</p>
                    <p className="font-medium">{attendance.checkOut}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No attendance records found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <MarkAttendanceDialog
        open={showMarkAttendance}
        onOpenChange={setShowMarkAttendance}
        onSaveSuccess={() => {
          refreshAttendance()
        }}
      />
    </div>
  )
}

const statusColors = {
  present: "bg-green-500/10 text-green-500 border-green-500/20",
  absent: "bg-red-500/10 text-red-500 border-red-500/20",
  "half-day": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  overtime: "bg-blue-500/10 text-blue-500 border-blue-500/20",
}

export default function AttendancePage() {
  return (
    <Suspense fallback={null}>
      <AttendanceContent />
    </Suspense>
  )
}
