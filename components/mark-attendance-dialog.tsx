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
import { Check, X, Users, Clock, UserPlus, Loader2 } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { apiService } from "@/lib/api-service"
import { Project, Employee } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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

export function MarkAttendanceDialog({ open, onOpenChange, projectId, onSaveSuccess }: MarkAttendanceDialogProps) {
  const [selectedProject, setSelectedProject] = useState(projectId || "")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceEntry>>({})
  const [isSaving, setIsSaving] = useState(false)

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

  const projectEmployees = (employees || []).filter((emp: Employee) => emp.projectId === selectedProject)
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
      toast.error("Please select a project")
      return
    }

    const records = (Object.values(attendanceData) as AttendanceEntry[]).map((record: AttendanceEntry) => ({
      ...record,
      projectId: selectedProject,
      date: selectedDate
    }))

    if (records.length === 0) {
      toast.error("No attendance data to save")
      return
    }

    setIsSaving(true)
    try {
      // In a real scenario, we might have a bulk endpoint or loop
      // Assuming the backend handles bulk or we send one by one
      // For now, let's just send the first one as a test or assume /attendance accepts array
      await apiService.post("/attendance", { records })
      toast.success("Attendance saved successfully")
      onSaveSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error("Failed to save attendance")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Daily Attendance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project and Date Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Input type="date" value={selectedDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)} />
            </div>
          </div>

          {selectedProject && (
            <>
              {/* Bulk Actions */}
              <div className="flex flex-wrap gap-2 pb-4 border-b">
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
                <Card className="bg-muted/50">
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
              <div className="space-y-3">
                {allWorkers.map((employee) => {
                  const attendance = attendanceData[employee.id]
                  const status = attendance?.status || "present"
                  const isTemp = "isTemporary" in employee

                  return (
                    <Card key={employee.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {/* Employee Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {employee.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                {employee.name}
                                {isTemp && (
                                  <Badge variant="secondary" className="text-xs">
                                    Temp
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{employee.role}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ₹{employee.dailyRate}/day
                          </Badge>
                        </div>

                        {/* Attendance Status Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <Button
                            variant={status === "present" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAttendance(employee.id, { status: "present", hours: 8 })}
                            className={cn(status === "present" && "bg-green-500 hover:bg-green-600 border-green-500")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            variant={status === "absent" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAttendance(employee.id, { status: "absent", hours: 0 })}
                            className={cn(status === "absent" && "bg-red-500 hover:bg-red-600 border-red-500")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                          <Button
                            variant={status === "half-day" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAttendance(employee.id, { status: "half-day", hours: 4 })}
                            className={cn(
                              status === "half-day" && "bg-yellow-500 hover:bg-yellow-600 border-yellow-500",
                            )}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Half Day
                          </Button>
                        </div>

                        {/* Additional Details for Present/Half-Day */}
                        {(status === "present" || status === "half-day") && (
                          <div className="space-y-3 pt-3 border-t">
                            {/* Time Entry */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Check In</Label>
                                <Input
                                  type="time"
                                  value={attendance?.checkIn || "08:00"}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAttendance(employee.id, { checkIn: e.target.value })}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Check Out</Label>
                                <Input
                                  type="time"
                                  value={attendance?.checkOut || "17:00"}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAttendance(employee.id, { checkOut: e.target.value })}
                                  className="h-9"
                                />
                              </div>
                            </div>

                            {/* Work Description */}
                            <div className="space-y-2">
                              <Label className="text-xs">Work Description (Optional)</Label>
                              <Textarea
                                placeholder="Describe what work this employee did today..."
                                value={attendance?.workDescription || ""}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateAttendance(employee.id, { workDescription: e.target.value })}
                                className="min-h-[60px] resize-none text-sm"
                              />
                            </div>

                            {/* Payment Split */}
                            <div className="space-y-2">
                              <Label className="text-xs">Payment Split</Label>
                              <Select
                                value={attendance?.paymentSplit || "full-owner"}
                                onValueChange={(value: "full-owner" | "full-contractor" | "half-half" | "custom") => {
                                  if (value === "full-owner") {
                                    updateAttendance(employee.id, {
                                      paymentSplit: value,
                                      ownerPay: 100,
                                      contractorPay: 0,
                                    })
                                  } else if (value === "full-contractor") {
                                    updateAttendance(employee.id, {
                                      paymentSplit: value,
                                      ownerPay: 0,
                                      contractorPay: 100,
                                    })
                                  } else if (value === "half-half") {
                                    updateAttendance(employee.id, {
                                      paymentSplit: value,
                                      ownerPay: 50,
                                      contractorPay: 50,
                                    })
                                  } else {
                                    updateAttendance(employee.id, { paymentSplit: value })
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full-owner">100% Owner</SelectItem>
                                  <SelectItem value="full-contractor">100% Contractor</SelectItem>
                                  <SelectItem value="half-half">50% Owner + 50% Contractor</SelectItem>
                                  <SelectItem value="custom">Custom Split</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Custom Payment Split */}
                              {attendance?.paymentSplit === "custom" && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Owner %</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={attendance?.ownerPay || 0}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        updateAttendance(employee.id, {
                                          ownerPay: Number(e.target.value),
                                          contractorPay: 100 - Number(e.target.value),
                                        })
                                      }
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Contractor %</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={attendance?.contractorPay || 0}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        updateAttendance(employee.id, {
                                          contractorPay: Number(e.target.value),
                                          ownerPay: 100 - Number(e.target.value),
                                        })
                                      }
                                      className="h-9"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Payment Breakdown */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                <span>
                                  Owner: ₹{((employee.dailyRate * (attendance?.ownerPay || 100)) / 100).toFixed(0)}
                                </span>
                                <span>
                                  Contractor: ₹
                                  {((employee.dailyRate * (attendance?.contractorPay || 0)) / 100).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
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
            </>
          )}

          {!selectedProject && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a project to mark attendance</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
