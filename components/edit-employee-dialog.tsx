"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { Project, Employee } from "@/lib/mock-data"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface EditEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee: Employee
    onSaveSuccess?: () => void
}

export function EditEmployeeDialog({ open, onOpenChange, employee, onSaveSuccess }: EditEmployeeDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const { data: projects, loading: projectsLoading } = useApi<Project[]>("/projects")

    const [formData, setFormData] = useState({
        name: employee.name,
        role: employee.role,
        phone: employee.phone,
        email: employee.email,
        dailyRate: employee.dailyRate.toString(),
        status: employee.status,
        projectId: employee.projectId,
    })

    useEffect(() => {
        if (open && employee) {
            setFormData({
                name: employee.name,
                role: employee.role,
                phone: employee.phone,
                email: employee.email,
                dailyRate: employee.dailyRate.toString(),
                status: employee.status,
                projectId: employee.projectId,
            })
        }
    }, [open, employee])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.dailyRate || !formData.projectId) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            await apiService.put(`/employees/${employee.id}`, {
                ...formData,
                dailyRate: Number(formData.dailyRate)
            })
            toast.success("Employee updated successfully")
            onSaveSuccess?.()
            onOpenChange(false)
        } catch (err) {
            toast.error("Failed to update employee")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Employee</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Full Name *</Label>
                        <Input
                            id="edit-name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: string) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger id="edit-role">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Helper">Helper</SelectItem>
                                    <SelectItem value="Mason">Mason</SelectItem>
                                    <SelectItem value="Carpenter">Carpenter</SelectItem>
                                    <SelectItem value="Electrician">Electrician</SelectItem>
                                    <SelectItem value="Plumber">Plumber</SelectItem>
                                    <SelectItem value="Labor">Labor</SelectItem>
                                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: string) => setFormData({ ...formData, status: value as any })}
                            >
                                <SelectTrigger id="edit-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="on-leave">On Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-dailyRate">Daily Rate (₹) *</Label>
                            <Input
                                id="edit-dailyRate"
                                type="number"
                                placeholder="500"
                                value={formData.dailyRate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dailyRate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-projectId">Assign Project *</Label>
                            <Select
                                value={formData.projectId}
                                onValueChange={(value: string) => setFormData({ ...formData, projectId: value })}
                            >
                                <SelectTrigger id="edit-projectId">
                                    <SelectValue placeholder={projectsLoading ? "Loading..." : "Select project"} />
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
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input
                            id="edit-phone"
                            type="tel"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-email">Email Address</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Employee"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
