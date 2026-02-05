"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { Attendance } from "@/lib/mock-data"
import { toast } from "sonner"

interface EditAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    attendance: Attendance | null
    onSaveSuccess?: () => void
}

export function EditAttendanceDialog({
    open,
    onOpenChange,
    attendance,
    onSaveSuccess
}: EditAttendanceDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        status: "present",
        checkIn: "08:00",
        checkOut: "17:00",
        overtime: "0",
        hours: "8",
        description: ""
    })

    // Update form data when attendance changes
    useEffect(() => {
        if (attendance) {
            setFormData({
                status: attendance.status || "present",
                checkIn: attendance.checkIn || "08:00",
                checkOut: attendance.checkOut || "17:00",
                overtime: String(attendance.overtime || 0),
                hours: String(attendance.hours || 8),
                description: (attendance as any).description || ""
            })
        }
    }, [attendance])

    // Reset error when dialog opens
    useEffect(() => {
        if (open) setError(null)
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Try multiple ways to get the ID
        const attendanceId = attendance?.id ||
            (attendance as any)?._id?.toString() ||
            (attendance as any)?._id

        if (!attendanceId) {
            setError("Invalid attendance record - missing ID")
            return
        }

        setIsSaving(true)
        try {
            const updateData = {
                status: formData.status,
                checkIn: formData.status === 'absent' ? '' : formData.checkIn,
                checkOut: formData.status === 'absent' ? '' : formData.checkOut,
                hours: formData.status === 'half-day' ? 4 : (formData.status === 'absent' ? 0 : Number(formData.hours)),
                overtime: Number(formData.overtime),
                description: formData.description
            }

            await apiService.put(`/attendance/${attendanceId}`, updateData)
            toast.success("Attendance updated successfully")
            onSaveSuccess?.()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update attendance")
        } finally {
            setIsSaving(false)
        }
    }

    // Helper to get employee name
    const getEmployeeName = () => {
        if (!attendance) return "Unknown"
        if ((attendance as any).employeeName) return (attendance as any).employeeName
        return (attendance.employeeId as any)?.name || "Unknown Employee"
    }

    // Helper to get project name
    const getProjectName = () => {
        if (!attendance) return "Unknown"
        if ((attendance as any).projectName) return (attendance as any).projectName
        return (attendance.projectId as any)?.name || "Unknown Project"
    }

    if (!attendance) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Attendance</DialogTitle>
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
                            {getEmployeeName()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Project</Label>
                        <div className="p-2 bg-muted rounded border text-sm font-medium">
                            {getProjectName()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Date</Label>
                        <div className="p-2 bg-muted rounded border text-sm font-medium">
                            {new Date(attendance.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
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
                                    <SelectItem value="overtime">Overtime</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="overtime">Overtime (Hours)</Label>
                            <Input
                                id="overtime"
                                type="number"
                                min="0"
                                step="0.5"
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

                    {formData.status === 'present' && (
                        <div className="space-y-2">
                            <Label htmlFor="hours">Work Hours</Label>
                            <Input
                                id="hours"
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={formData.hours}
                                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">Work Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the work done on this day..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Add details about tasks completed, site conditions, or any relevant notes.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
