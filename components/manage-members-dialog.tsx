"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Loader2, AlertCircle, Users } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { apiService } from "@/lib/api-service"
import { Employee, Project } from "@/lib/mock-data"
import { toast } from "sonner"

interface ManageMembersDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    onSaveSuccess?: () => void
}

export function ManageMembersDialog({
    open,
    onOpenChange,
    projectId,
    onSaveSuccess,
}: ManageMembersDialogProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { data: employees, loading: employeesLoading } = useApi<Employee[]>("/employees")
    const { data: projects } = useApi<Project[]>("/projects")

    useEffect(() => {
        if (open && employees) {
            // Pre-select employees already in this project
            const currentMembers = employees
                .filter((e) => {
                    const projectIds = e.projectIds || []
                    return projectIds.includes(projectId)
                })
                .map((e) => e.id || (e as any)._id)
            setSelectedEmployeeIds(currentMembers)
            setError(null)
        }
    }, [open, employees, projectId])

    const filteredEmployees = (employees || []).filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleEmployee = (employeeId: string) => {
        setSelectedEmployeeIds((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId]
        )
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)

        try {
            // 1. Get current project members
            const projectResponse = await apiService.get<Project>(`/projects/${projectId}`)
            const currentProj = projectResponse
            const originalMemberIds = (currentProj.employeeIds || []).map(e => typeof e === 'string' ? e : (e as any).id || (e as any)._id)

            const toAdd = selectedEmployeeIds.filter(id => !originalMemberIds.includes(id))
            const toRemove = originalMemberIds.filter(id => !selectedEmployeeIds.includes(id))

            // 2. Update Employee records
            const employeeUpdatePromises = []

            // For workers being added
            for (const empId of toAdd) {
                const emp = employees?.find(e => (e.id || (e as any)._id) === empId)
                if (emp) {
                    const newProjectIds = Array.from(new Set([...(emp.projectIds || []), projectId]))
                    employeeUpdatePromises.push(apiService.put(`/employees/${empId}`, { projectIds: newProjectIds }))
                }
            }

            // For workers being removed
            for (const empId of toRemove) {
                const emp = employees?.find(e => (e.id || (e as any)._id) === empId)
                if (emp) {
                    const newProjectIds = (emp.projectIds || []).filter(pId => pId !== projectId)
                    employeeUpdatePromises.push(apiService.put(`/employees/${empId}`, { projectIds: newProjectIds }))
                }
            }

            await Promise.all(employeeUpdatePromises)

            // 3. Update Project record with the full selected set
            await apiService.put(`/projects/${projectId}`, {
                employeeIds: selectedEmployeeIds,
                workers: selectedEmployeeIds.length // Keep visual workers count in sync
            })

            toast.success("Project team updated successfully")
            onSaveSuccess?.()
            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || "Failed to update team members")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2 shrink-0 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Manage Project Team
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees by name or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mx-6 mt-4 bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-2">
                    {employeesLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>Loading employees...</p>
                        </div>
                    ) : filteredEmployees.length > 0 ? (
                        <div className="grid gap-1 p-2">
                            {filteredEmployees.map((employee) => {
                                const isSelected = selectedEmployeeIds.includes(employee.id)
                                const otherProjects = (employee.projectIds || []).filter(id => id !== projectId)
                                const assignedProjects = (projects || []).filter(p => otherProjects.includes(p.id))

                                return (
                                    <div
                                        key={employee.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-primary/5" : ""
                                            }`}
                                        onClick={() => toggleEmployee(employee.id)}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleEmployee(employee.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                                                {employee.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{employee.name}</p>
                                            <p className="text-xs text-muted-foreground">{employee.role}</p>
                                            {assignedProjects.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {assignedProjects.map(p => (
                                                        <span key={p.id} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/10">
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                            <Users className="h-12 w-12 opacity-20 mb-4" />
                            <p>No employees found</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t shrink-0 flex items-center justify-between bg-background">
                    <p className="text-xs text-muted-foreground">
                        {selectedEmployeeIds.length} members selected
                    </p>
                    <div className="flex gap-2">
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
                                "Save Team"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
