"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useApi } from "@/hooks/use-api"
import { Project } from "@/lib/mock-data"
import { toast } from "sonner"

interface AddExpenseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveSuccess?: () => void
}

export function AddExpenseDialog({ open, onOpenChange, onSaveSuccess }: AddExpenseDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const { data: projects, loading: projectsLoading } = useApi<Project[]>("/projects")

    const [formData, setFormData] = useState({
        category: "Materials",
        description: "",
        amount: "",
        projectId: "",
        date: new Date().toISOString().split("T")[0],
        submittedBy: "",
        status: "pending",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.description || !formData.amount || !formData.projectId) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            await apiService.post("/expenses", {
                ...formData,
                amount: Number(formData.amount)
            })
            toast.success("Expense submitted successfully")
            onSaveSuccess?.()
            onOpenChange(false)
            setFormData({
                category: "Materials",
                description: "",
                amount: "",
                projectId: "",
                date: new Date().toISOString().split("T")[0],
                submittedBy: "",
                status: "pending",
            })
        } catch (err) {
            toast.error("Failed to submit expense")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value: string) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Materials">Materials</SelectItem>
                                    <SelectItem value="Labor">Labor</SelectItem>
                                    <SelectItem value="Equipment">Equipment</SelectItem>
                                    <SelectItem value="Transport">Transport</SelectItem>
                                    <SelectItem value="Utilities">Utilities</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="1000"
                                value={formData.amount}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="projectId">Project *</Label>
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
                        <Label htmlFor="date">Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="submittedBy">Submitted By</Label>
                        <Input
                            id="submittedBy"
                            placeholder="Your name"
                            value={formData.submittedBy}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, submittedBy: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="What was this expense for?"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[80px]"
                            required
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
                                    Submitting...
                                </>
                            ) : (
                                "Submit Expense"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
