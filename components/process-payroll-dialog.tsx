"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calculator } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useApi } from "@/hooks/use-api"
import { Employee, Project, Attendance } from "@/lib/mock-data"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface ProcessPayrollDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveSuccess?: () => void
    initialEmployeeId?: string
}

export function ProcessPayrollDialog({ open, onOpenChange, onSaveSuccess, initialEmployeeId }: ProcessPayrollDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const { data: employees, loading: employeesLoading } = useApi<Employee[]>("/employees")
    const { data: projects, loading: projectsLoading } = useApi<Project[]>("/projects")
    const { data: attendanceDocs } = useApi<Attendance[]>("/attendance")

    const [formData, setFormData] = useState({
        employeeId: initialEmployeeId || "",
        projectId: "",
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        description: "",
        status: "paid",
        type: "adhoc" // adhoc, salary, advance
    })

    // Update state if initialEmployeeId changes (e.g. when opening from different context)
    useMemo(() => {
        if (initialEmployeeId && formData.employeeId !== initialEmployeeId) {
            setFormData(prev => ({ ...prev, employeeId: initialEmployeeId }))
        }
    }, [initialEmployeeId])

    // Calculate Estimated Pay based on Attendance for the selected Month (derived from Payment Date)
    const calculatedPay = useMemo(() => {
        if (!formData.employeeId || !formData.projectId || !formData.paymentDate || !attendanceDocs || !employees) return 0

        const selectedEmployee = employees.find(e => e.id === formData.employeeId)
        if (!selectedEmployee) return 0
        const dailyRate = selectedEmployee.dailyRate || 0

        // Filter for month/year of selected date
        const payDate = new Date(formData.paymentDate)
        const targetMonth = payDate.getMonth()
        const targetYear = payDate.getFullYear()

        const relevantAttendance = attendanceDocs.filter((att: any) => {
            // Check Employee
            const empId = typeof att.employeeId === 'object' ? att.employeeId._id || att.employeeId.id : att.employeeId
            if (empId !== formData.employeeId) return false

            // Check Project
            const projId = typeof att.projectId === 'object' ? att.projectId._id || att.projectId.id : att.projectId
            if (projId !== formData.projectId) return false

            // Check Date
            const attDate = new Date(att.date)
            return attDate.getMonth() === targetMonth && attDate.getFullYear() === targetYear
        })

        // Sum up
        let total = 0
        relevantAttendance.forEach((att: any) => {
            if (att.status === 'present') total += dailyRate
            else if (att.status === 'half-day') total += (dailyRate / 2)
            // else if (att.status === 'overtime') ... (handle if complex)
        })

        return total
    }, [formData.employeeId, formData.projectId, formData.paymentDate, attendanceDocs, employees])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.employeeId || !formData.amount || !formData.paymentDate) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            await apiService.post("/payroll", {
                employeeId: formData.employeeId,
                projectId: formData.projectId || undefined,
                netPay: Number(formData.amount),
                paymentDate: formData.paymentDate,
                description: formData.description,
                status: formData.status,
                paymentType: formData.type,
                period: "Flexible", // Satisfies stale schema 'required' check
                // Optional fields set to 0/empty to satisfy legacy schema if strict
                daysWorked: 0,
                dailyRate: 0,
                basePay: 0,
                overtimePay: 0,
                bonus: 0,
                deductions: 0,
            })
            toast.success("Payment recorded successfully")
            onSaveSuccess?.()
            onOpenChange(false)
            setFormData({
                employeeId: initialEmployeeId || "",
                projectId: "",
                amount: "",
                paymentDate: new Date().toISOString().split('T')[0],
                description: "",
                status: "paid",
                type: "adhoc"
            })
        } catch (err) {
            toast.error("Failed to record payment")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="employeeId">Select Employee *</Label>
                            <Select
                                value={formData.employeeId}
                                onValueChange={(value: string) => setFormData({ ...formData, employeeId: value })}
                            >
                                <SelectTrigger id="employeeId">
                                    <SelectValue placeholder={employeesLoading ? "Loading..." : "Choose employee"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(employees || []).map((emp: Employee) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="projectId">Select Project *</Label>
                            <Select
                                value={formData.projectId}
                                onValueChange={(value: string) => setFormData({ ...formData, projectId: value })}
                            >
                                <SelectTrigger id="projectId">
                                    <SelectValue placeholder={projectsLoading ? "Loading..." : "Choose project"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(projects || []).map((proj: Project) => (
                                        <SelectItem key={proj.id} value={proj.id}>
                                            {proj.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Payment Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.paymentDate}
                            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Calculating attendance for: {new Date(formData.paymentDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    {/* Amount Block with Calculation */}
                    <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                            <Label htmlFor="amount" className="text-base">Amount to Pay (₹) *</Label>
                            {calculatedPay > 0 && (
                                <Badge variant="outline" className="bg-background text-green-600 border-green-200">
                                    Attendance Due: ₹{calculatedPay.toLocaleString()}
                                </Badge>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                className="text-lg font-semibold h-11"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-11 px-4"
                                onClick={() => setFormData(prev => ({ ...prev, amount: calculatedPay.toString() }))}
                                disabled={calculatedPay === 0}
                                title="Auto-fill calculated amount"
                            >
                                <span className="mr-2 hidden sm:inline">Max</span>
                                <Calculator className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="e.g. Salary Advance, Material Purchase reimbursement..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Payment Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Record Payment"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
