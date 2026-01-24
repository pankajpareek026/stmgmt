"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { Project } from "@/lib/mock-data"
import { toast } from "sonner"

interface EditProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: Project
    onSaveSuccess?: () => void
}

export function EditProjectDialog({ open, onOpenChange, project, onSaveSuccess }: EditProjectDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: project.name,
        location: project.location,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate || "",
        budget: project.budget.toString(),
        manager: project.manager,
        description: project.description || "",
    })

    useEffect(() => {
        if (open) {
            setError(null)
            if (project) {
                setFormData({
                    name: project.name,
                    location: project.location,
                    status: project.status,
                    startDate: project.startDate,
                    endDate: project.endDate || "",
                    budget: project.budget.toString(),
                    manager: project.manager,
                    description: project.description || "",
                })
            }
        }
    }, [open, project])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!formData.name || !formData.location || !formData.budget) {
            setError("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            await apiService.put(`/projects/${project.id}`, {
                ...formData,
                budget: Number(formData.budget)
            })
            toast.success("Project updated successfully")
            onSaveSuccess?.()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update project")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-proj-name">Project Name *</Label>
                        <Input
                            id="edit-proj-name"
                            placeholder="e.g. City Heights Apartment"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-proj-location">Location *</Label>
                        <Input
                            id="edit-proj-location"
                            placeholder="e.g. Downtown, Metropolis"
                            value={formData.location}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-proj-status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: string) => setFormData({ ...formData, status: value as any })}
                            >
                                <SelectTrigger id="edit-proj-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="planning">Planning</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="on-hold">On Hold</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-proj-budget">Total Budget (₹) *</Label>
                            <Input
                                id="edit-proj-budget"
                                type="number"
                                placeholder="1000000"
                                value={formData.budget}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, budget: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-proj-startDate">Start Date *</Label>
                            <Input
                                id="edit-proj-startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-proj-endDate">Expected End Date</Label>
                            <Input
                                id="edit-proj-endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-proj-manager">Project Manager</Label>
                        <Input
                            id="edit-proj-manager"
                            placeholder="Manager name"
                            value={formData.manager}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, manager: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-proj-description">Description</Label>
                        <Textarea
                            id="edit-proj-description"
                            placeholder="Brief project details..."
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[80px]"
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
                                "Update Project"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
