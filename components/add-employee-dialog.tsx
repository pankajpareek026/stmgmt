"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { Project } from "@/lib/mock-data"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"

interface AddEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveSuccess?: () => void
}

export function AddEmployeeDialog({ open, onOpenChange, onSaveSuccess }: AddEmployeeDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { data: projects, loading: projectsLoading } = useApi<Project[]>("/projects")

    const [formData, setFormData] = useState({
        name: "",
        role: "Helper",
        phone: "",
        email: "",
        dailyRate: "",
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
        projectId: "",
    })

    // Reset error when dialog opens
    useEffect(() => {
        if (open) setError(null)
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validate required fields (matching API requirements)
        if (!formData.name || !formData.dailyRate || !formData.email || !formData.phone) {
            setError("Please fill in all required fields: Name, Role, Rate, Phone, Email")
            return
        }

        setIsSaving(true)
        try {
            // Prepare payload - handle empty projectId
            const payload = {
                ...formData,
                dailyRate: Number(formData.dailyRate),
                projectId: formData.projectId || undefined // Send undefined if empty to avoid CastError
            }

            await apiService.post("/employees", payload)
            toast.success("Employee added successfully")
            onSaveSuccess?.()
            onOpenChange(false)
            setFormData({
                name: "",
                role: "Helper",
                phone: "",
                email: "",
                dailyRate: "",
                status: "active",
                joinDate: new Date().toISOString().split("T")[0],
                projectId: "",
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add employee")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: string) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger id="role">
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
                            <Label htmlFor="dailyRate">Daily Rate (₹) *</Label>
                            <Input
                                id="dailyRate"
                                type="number"
                                placeholder="500"
                                value={formData.dailyRate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dailyRate: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="projectId">Assign Project (Optional)</Label>
                        <Select
                            value={formData.projectId}
                            onValueChange={(value: string) => setFormData({ ...formData, projectId: value })}
                        >
                            <SelectTrigger id="projectId">
                                <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select project"} />
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
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="joinDate">Join Date *</Label>
                        <DatePicker
                            date={formData.joinDate ? new Date(formData.joinDate) : undefined}
                            setDate={(date) => setFormData({
                                ...formData,
                                joinDate: date ? date.toISOString().split('T')[0] : ""
                            })}
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
                                    Adding...
                                </>
                            ) : (
                                "Add Employee"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
