"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { Employee, Project } from "@/lib/mock-data"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"
import { DatePicker } from "@/components/ui/date-picker"

interface MarkEmployeeAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee: Employee
    currentProjectId?: string | null
    onSaveSuccess?: () => void
}

export function MarkEmployeeAttendanceDialog({
    open,
    onOpenChange,
    employee,
    currentProjectId,
    onSaveSuccess
}: MarkEmployeeAttendanceDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { data: projects } = useApi<Project[]>("/projects")

    const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()])
    const [formData, setFormData] = useState({
        projectId: currentProjectId || "",
        status: "present",
        checkIn: "08:00",
        checkOut: "17:00",
        overtime: "0"
    })

    // Update projectId if currentProject changes and we haven't selected one yet
    useEffect(() => {
        if (currentProjectId && !formData.projectId) {
            setFormData(prev => ({ ...prev, projectId: currentProjectId }))
        }
    }, [currentProjectId])

    // Reset error when dialog opens
    useEffect(() => {
        if (open) setError(null)
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.projectId) {
            setError("Please select a project")
            return
        }

        if (selectedDates.length === 0) {
            setError("Please select at least one date")
            return
        }

        if (selectedDates.length > 31) {
            if (!confirm(`You are about to mark attendance for ${selectedDates.length} days. Continue?`)) {
                return
            }
        }

        setIsSaving(true)
        try {
            const promises = []

            // Loop through each selected date
            for (const date of selectedDates) {
                const dateStr = date.toISOString().split('T')[0]

                const record = {
                    employeeId: employee.id,
                    projectId: formData.projectId,
                    date: dateStr,
                    status: formData.status,
                    checkIn: formData.status === 'absent' ? '' : formData.checkIn,
                    checkOut: formData.status === 'absent' ? '' : formData.checkOut,
                    hours: formData.status === 'half-day' ? 4 : (formData.status === 'absent' ? 0 : 8),
                    overtime: Number(formData.overtime)
                }

                promises.push(apiService.post("/attendance", { records: [record] }))
            }

            await Promise.all(promises)

            toast.success(`Attendance marked for ${selectedDates.length} days`)
            onSaveSuccess?.()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to mark attendance")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mark Attendance</DialogTitle>
                </DialogHeader>
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    <div className="space-y-2">
                        <Label>Employee</Label>
                        <div className="p-2 bg-muted rounded border text-sm font-medium">
                            {employee.name}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Select Dates</Label>
                        <DatePicker
                            mode="multiple"
                            dates={selectedDates}
                            setDates={setSelectedDates as any}
                            placeholder="Click to select dates"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            {selectedDates.length > 0
                                ? `Selected: ${selectedDates.map(d => d.getDate()).join(', ')}`
                                : 'No dates selected'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project">Project *</Label>
                        <Select
                            value={formData.projectId}
                            onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {(projects || []).map((p: Project) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="half-day">Half Day</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="overtime">Overtime (Hours)</Label>
                            <Input
                                id="overtime"
                                type="number"
                                min="0"
                                value={formData.overtime}
                                onChange={(e) => setFormData({ ...formData, overtime: e.target.value })}
                            />
                        </div>
                    </div>

                    {formData.status !== 'absent' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="checkIn">Check In</Label>
                                <Input
                                    id="checkIn"
                                    type="time"
                                    value={formData.checkIn}
                                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="checkOut">Check Out</Label>
                                <Input
                                    id="checkOut"
                                    type="time"
                                    value={formData.checkOut}
                                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Marks"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
