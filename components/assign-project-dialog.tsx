"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { apiService } from "@/lib/api-service"
import { Project, Employee } from "@/lib/mock-data"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface AssignProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee: Employee
    onSaveSuccess?: () => void
}

export function AssignProjectDialog({ open, onOpenChange, employee, onSaveSuccess }: AssignProjectDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { data: projects, loading: projectsLoading } = useApi<Project[]>("/projects")

    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(employee.projectIds || [])

    useEffect(() => {
        if (open) {
            setError(null)
            setSelectedProjectIds(employee.projectIds || [])
        }
    }, [open, employee.projectIds])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        setIsSaving(true)
        try {
            await apiService.put(`/employees/${employee.id}`, {
                projectIds: selectedProjectIds
            })
            toast.success("Assignments updated successfully")
            onSaveSuccess?.()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to assign project")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Assign to Project</DialogTitle>
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
                        <Label>Select Projects</Label>
                        <div className="border rounded-md p-3 space-y-2 max-h-[250px] overflow-y-auto bg-background">
                            {projectsLoading ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : (projects || []).length > 0 ? (
                                (projects || []).map((p: Project) => (
                                    <div key={p.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`assign-proj-${p.id}`}
                                            checked={selectedProjectIds.includes(p.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedProjectIds([...selectedProjectIds, p.id])
                                                } else {
                                                    setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id))
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`assign-proj-${p.id}`} className="text-sm cursor-pointer truncate">
                                            {p.name}
                                        </Label>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No projects found</p>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {selectedProjectIds.length} projects selected
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Assignments"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
