"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
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

    const employeeProjectId = typeof employee.projectId === 'object' && employee.projectId !== null
        ? (employee.projectId as any).id
        : employee.projectId

    const [selectedProjectId, setSelectedProjectId] = useState(employeeProjectId || "")

    useEffect(() => {
        if (open) {
            setError(null)
            setSelectedProjectId(employeeProjectId || "")
        }
    }, [open, employeeProjectId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        setIsSaving(true)
        try {
            await apiService.put(`/employees/${employee.id}`, {
                projectId: selectedProjectId || null
            })
            toast.success("Project reassigned successfully")
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
                        <Label htmlFor="assign-project">Select Project</Label>
                        <Select
                            value={selectedProjectId}
                            onValueChange={setSelectedProjectId}
                        >
                            <SelectTrigger id="assign-project">
                                <SelectValue placeholder={projectsLoading ? "Loading..." : "Unassigned / None"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Unassigned / None</SelectItem>
                                {(projects || []).map((p: Project) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving || selectedProjectId === (employeeProjectId || "none")}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Assignment"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
