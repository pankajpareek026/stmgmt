"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Users, Clock, UserPlus, Loader2, AlertCircle } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { apiService } from "@/lib/api-service"
import { Project, Employee } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"

interface MarkAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  onSaveSuccess?: () => void
}

interface AttendanceEntry {
  employeeId: string
  status: "present" | "absent" | "half-day"
  hours: number
  paymentSplit: "full-owner" | "full-contractor" | "half-half" | "custom"
  ownerPay: number
  contractorPay: number
  checkIn: string
  checkOut: string
  workDescription?: string
}

interface TemporaryWorker {
  id: string
  name: string
  role: string
  dailyRate: number
  phone: string
  isTemporary: true
}

const AttendanceRow = ({
  employee,
  attendance,
  updateAttendance
}: {
  employee: Employee | TemporaryWorker
  attendance: AttendanceEntry
  updateAttendance: (id: string, updates: Partial<AttendanceEntry>) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const status = attendance?.status || "present"
  const isTemp = "isTemporary" in employee

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors max-w-full overflow-hidden",
        status === "absent" ? "bg-muted/30" : "bg-card"
      )}
    >
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        {/* Employee Info */}
        <div className="flex items-center justify-between xl:w-[30%] text-left min-w-0">
          <div className="flex items-center gap-3 min-w-0 w-full">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {(employee.name || "Unknown").split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm flex items-center gap-1.5 truncate">
                {employee.name || "Unknown"}
                {isTemp && <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4">Temp</Badge>}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{employee.role}</span>
                <span className="w-px h-3 bg-border" />
                <span className="shrink-0">₹{employee.dailyRate}/d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Controls */}
        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          <div className="flex items-center bg-secondary/50 rounded-md p-1 gap-1 shrink-0">
            <button
              onClick={() => updateAttendance(employee.id, { status: "present", hours: 8 })}
              className={cn(
                "p-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1",
                status === "present" ? "bg-background shadow-sm text-green-600" : "text-muted-foreground hover:bg-background/50"
              )}
            >
              <Check className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Present</span>
            </button>
            <button
              onClick={() => updateAttendance(employee.id, { status: "absent", hours: 0 })}
              className={cn(
                "p-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1",
                status === "absent" ? "bg-background shadow-sm text-red-600" : "text-muted-foreground hover:bg-background/50"
              )}
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Absent</span>
            </button>
            <button
              onClick={() => updateAttendance(employee.id, { status: "half-day", hours: 4 })}
              className={cn(
                "p-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1",
                status === "half-day" ? "bg-background shadow-sm text-yellow-600" : "text-muted-foreground hover:bg-background/50"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Half</span>
            </button>
          </div>
        </div>

      </div>

      {/* Expand Toggle - Always visible if status suggests more info needed */}
      {(status === "present" || status === "half-day") && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 ml-auto xl:ml-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cn("transition-transform", isExpanded && "rotate-180")}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Button>
      )}

      {/* Expandable Details */}
      {
        (status === "present" || status === "half-day") && isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3">
            {/* Time Inputs - Now in collapsible area */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-16">Time:</span>
                <Input
                  type="time"
                  value={attendance?.checkIn || "08:00"}
                  onChange={(e) => updateAttendance(employee.id, { checkIn: e.target.value })}
                  className="h-8 w-24 text-xs px-2 bg-background"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={attendance?.checkOut || "17:00"}
                  onChange={(e) => updateAttendance(employee.id, { checkOut: e.target.value })}
                  className="h-8 w-24 text-xs px-2 bg-background"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Select
                  value={attendance?.paymentSplit || "full-owner"}
                  onValueChange={(value: any) => {
                    if (value === "full-owner") updateAttendance(employee.id, { paymentSplit: value, ownerPay: 100, contractorPay: 0 })
                    else if (value === "full-contractor") updateAttendance(employee.id, { paymentSplit: value, ownerPay: 0, contractorPay: 100 })
                    else if (value === "half-half") updateAttendance(employee.id, { paymentSplit: value, ownerPay: 50, contractorPay: 50 })
                    else updateAttendance(employee.id, { paymentSplit: value })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-owner">100% Owner</SelectItem>
                    <SelectItem value="full-contractor">100% Contractor</SelectItem>
                    <SelectItem value="half-half">50/50 Split</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {attendance?.paymentSplit === "custom" && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Own%"
                      value={attendance?.ownerPay || 0}
                      onChange={(e) => updateAttendance(employee.id, { ownerPay: Number(e.target.value), contractorPay: 100 - Number(e.target.value) })}
                      className="h-8 w-14 text-xs px-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Cont%"
                      value={attendance?.contractorPay || 0}
                      onChange={(e) => updateAttendance(employee.id, { contractorPay: Number(e.target.value), ownerPay: 100 - Number(e.target.value) })}
                      className="h-8 w-14 text-xs px-1"
                    />
                  </div>
                )}
              </div>
              <Input
                placeholder="Work description..."
                value={attendance?.workDescription || ""}
                onChange={(e) => updateAttendance(employee.id, { workDescription: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )
      }
    </div >
  )
}

export function MarkAttendanceDialog({ open, onOpenChange, projectId, onSaveSuccess }: MarkAttendanceDialogProps) {
  const [selectedProject, setSelectedProject] = useState(projectId || "")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceEntry>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [temporaryWorkers, setTemporaryWorkers] = useState<TemporaryWorker[]>([])
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [newWorker, setNewWorker] = useState({
    name: "",
    role: "",
    dailyRate: "",
    phone: "",
  })

  const { data: projects, loading: projectsLoading } = useApi<Project[]>("/projects")
  const { data: employees, loading: employeesLoading } = useApi<Employee[]>("/employees")

  // Reset error when dialog opens
  useEffect(() => {
    if (open) setError(null)
  }, [open])

  const projectEmployees = (employees || []).filter((emp: Employee) => {
    return emp.projectIds?.includes(selectedProject)
  })
  const allWorkers = [...projectEmployees, ...temporaryWorkers]

  const handleAddWorker = () => {
    if (!newWorker.name || !newWorker.role || !newWorker.dailyRate) {
      toast.error("Please fill in all required fields")
      return
    }

    const tempWorker: TemporaryWorker = {
      id: `temp-${Date.now()}`,
      name: newWorker.name,
      role: newWorker.role,
      dailyRate: Number(newWorker.dailyRate),
      phone: newWorker.phone,
      isTemporary: true,
    }

    setTemporaryWorkers([...temporaryWorkers, tempWorker])
    setNewWorker({ name: "", role: "", dailyRate: "", phone: "" })
    setShowAddWorker(false)
    toast.success("Temporary worker added")
  }

  const updateAttendance = (employeeId: string, updates: Partial<AttendanceEntry>) => {
    setAttendanceData((prev: Record<string, AttendanceEntry>) => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] || {
          employeeId,
          status: "present",
          hours: 8,
          paymentSplit: "full-owner",
          ownerPay: 100,
          contractorPay: 0,
          checkIn: "08:00",
          checkOut: "17:00",
        }),
        ...updates,
      },
    }))
  }

  const markAllPresent = () => {
    const updates: Record<string, AttendanceEntry> = {}
    allWorkers.forEach((emp) => {
      updates[emp.id] = {
        employeeId: emp.id,
        status: "present",
        hours: 8,
        paymentSplit: "full-owner",
        ownerPay: 100,
        contractorPay: 0,
        checkIn: "08:00",
        checkOut: "17:00",
      }
    })
    setAttendanceData(updates)
  }

  const markAllAbsent = () => {
    const updates: Record<string, AttendanceEntry> = {}
    allWorkers.forEach((emp) => {
      updates[emp.id] = {
        employeeId: emp.id,
        status: "absent",
        hours: 0,
        paymentSplit: "full-owner",
        ownerPay: 0,
        contractorPay: 0,
        checkIn: "",
        checkOut: "",
      }
    })
    setAttendanceData(updates)
  }

  const handleSave = async () => {
    if (!selectedProject) {
      setError("Please select a project")
      return
    }

    const records = (Object.values(attendanceData) as AttendanceEntry[]).map((record: AttendanceEntry) => {
      const emp = (allWorkers || []).find(e => e.id === record.employeeId)
      const project = (projects || []).find(p => p.id === selectedProject)
      return {
        ...record,
        employeeName: emp?.name || "Unknown Worker",
        projectId: selectedProject,
        projectName: project?.name || "Unknown Project",
        date: selectedDate
      }
    })

    if (records.length === 0) {
      setError("No attendance data to save")
      return
    }

    try {
      setError(null)
      await apiService.post("/attendance", { records })
      toast.success("Attendance saved successfully")
      onSaveSuccess?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save attendance")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b">
          <DialogTitle>Mark Daily Attendance</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mx-6 mt-4 bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
          {/* Project and Date Selection */}
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div className="space-y-2">
              <Label>Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Choose a project"} />
                </SelectTrigger>
                <SelectContent>
                  {(projects || []).map((project: Project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                date={selectedDate ? new Date(selectedDate) : undefined}
                setDate={(date) => setSelectedDate(date ? date.toISOString().split("T")[0] : "")}
              />
            </div>
          </div>

          {selectedProject ? (
            <>
              {/* Bulk Actions */}
              <div className="flex flex-wrap gap-2 pb-4 border-b mb-4 sticky top-0 bg-background z-10 pt-1">
                <Button onClick={markAllPresent} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Check className="h-4 w-4 text-green-500" />
                  Mark All Present
                </Button>
                <Button onClick={markAllAbsent} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <X className="h-4 w-4 text-red-500" />
                  Mark All Absent
                </Button>
                <Button
                  onClick={() => setShowAddWorker(!showAddWorker)}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                >
                  <UserPlus className="h-4 w-4 text-primary" />
                  Add Temporary Worker
                </Button>
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {allWorkers.length} Workers
                  {temporaryWorkers.length > 0 && <span className="text-xs">({temporaryWorkers.length} temp)</span>}
                </div>
              </div>

              {showAddWorker && (
                <Card className="bg-muted/50 mb-4">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add Temporary Worker
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Name *</Label>
                        <Input
                          placeholder="Worker name"
                          value={newWorker.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWorker({ ...newWorker, name: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Role *</Label>
                        <Select
                          value={newWorker.role}
                          onValueChange={(value: string) => setNewWorker({ ...newWorker, role: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Helper">Helper</SelectItem>
                            <SelectItem value="Mason">Mason</SelectItem>
                            <SelectItem value="Carpenter">Carpenter</SelectItem>
                            <SelectItem value="Electrician">Electrician</SelectItem>
                            <SelectItem value="Plumber">Plumber</SelectItem>
                            <SelectItem value="Painter">Painter</SelectItem>
                            <SelectItem value="Labor">Labor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Daily Rate (₹) *</Label>
                        <Input
                          type="number"
                          placeholder="500"
                          value={newWorker.dailyRate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWorker({ ...newWorker, dailyRate: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Phone (Optional)</Label>
                        <Input
                          type="tel"
                          placeholder="9876543210"
                          value={newWorker.phone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWorker({ ...newWorker, phone: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAddWorker} size="sm">
                        Add Worker
                      </Button>
                      <Button onClick={() => setShowAddWorker(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Employee Attendance List */}
              <div className="space-y-2">
                {allWorkers.map((employee) => (
                  <AttendanceRow
                    key={employee.id}
                    employee={employee}
                    attendance={attendanceData[employee.id]}
                    updateAttendance={updateAttendance}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a project to mark attendance</p>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="p-6 pt-2 border-t shrink-0 flex justify-end gap-2 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Attendance"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
