"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { apiService } from "@/lib/api-service"
import { Project } from "@/lib/mock-data"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"
import { useCurrency } from "@/components/currency-provider"

interface AddEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveSuccess?: () => void
}

export function AddEmployeeDialog({ open, onOpenChange, onSaveSuccess }: AddEmployeeDialogProps) {
    const { currency } = useCurrency()
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
        joinDate: "",
        projectIds: [] as string[],
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
            const payload = {
                ...formData,
                dailyRate: Number(formData.dailyRate),
                projectIds: formData.projectIds
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
                joinDate: "",
                projectIds: [],
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
                            <Label htmlFor="dailyRate">Daily Rate ({currency.symbol}) *</Label>
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
                        <Label>Project Assignments</Label>
                        <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto bg-background">
                            {projectsLoading ? (
                                <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : (projects || []).map((project: Project) => (
                                <div key={project.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`add-proj-${project.id}`}
                                        checked={formData.projectIds.includes(project.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setFormData({ ...formData, projectIds: [...formData.projectIds, project.id] })
                                            } else {
                                                setFormData({ ...formData, projectIds: formData.projectIds.filter(id => id !== project.id) })
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`add-proj-${project.id}`} className="text-sm cursor-pointer truncate">
                                        {project.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
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
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="joinDate">Join Date *</Label>
                        <DatePicker
                            date={formData.joinDate ? (() => {
                                const [year, month, day] = formData.joinDate.split('-');
                                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
                            })() : undefined}
                            setDate={(date) => {
                                if (date) {
                                    // Ensure we use local date, not UTC
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    setFormData({
                                        ...formData,
                                        joinDate: `${year}-${month}-${day}`
                                    });
                                }
                            }}
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
