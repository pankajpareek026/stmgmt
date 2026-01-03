"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useApi } from "@/hooks/use-api"
import { Employee } from "@/lib/mock-data"
import { toast } from "sonner"

interface ProcessPayrollDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveSuccess?: () => void
}

export function ProcessPayrollDialog({ open, onOpenChange, onSaveSuccess }: ProcessPayrollDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const { data: employees, loading: employeesLoading } = useApi<Employee[]>("/employees")

    const [formData, setFormData] = useState({
        employeeId: "",
        period: "March 2024",
        basePay: "",
        overtimePay: "0",
        bonus: "0",
        deductions: "0",
        status: "pending",
    })

    // Autofill base pay when employee is selected
    useEffect(() => {
        if (formData.employeeId && employees) {
            const emp = employees.find((e: Employee) => e.id === formData.employeeId)
            if (emp) {
                // Daily rate * 26 days average as default? Or just use daily rate as hint
                setFormData((prev: typeof formData) => ({ ...prev, basePay: (emp.dailyRate * 26).toString() }))
            }
        }
    }, [formData.employeeId, employees])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.employeeId || !formData.basePay || !formData.period) {
            toast.error("Please fill in all required fields")
            return
        }

        const base = Number(formData.basePay)
        const overtime = Number(formData.overtimePay)
        const bonus = Number(formData.bonus)
        const deductions = Number(formData.deductions)
        const netPay = base + overtime + bonus - deductions

        setIsSaving(true)
        try {
            await apiService.post("/payroll", {
                ...formData,
                basePay: base,
                overtimePay: overtime,
                bonus: bonus,
                deductions: deductions,
                netPay: netPay
            })
            toast.success("Payroll processed successfully")
            onSaveSuccess?.()
            onOpenChange(false)
            setFormData({
                employeeId: "",
                period: "March 2024",
                basePay: "",
                overtimePay: "0",
                bonus: "0",
                deductions: "0",
                status: "pending",
            })
        } catch (err) {
            toast.error("Failed to process payroll")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Process Payroll</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="employeeId">Select Employee *</Label>
                        <Select
                            value={formData.employeeId}
                            onValueChange={(value: string) => setFormData({ ...formData, employeeId: value })}
                        >
                            <SelectTrigger id="employeeId">
                                <SelectValue placeholder={employeesLoading ? "Loading employees..." : "Choose employee"} />
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
                        <Label htmlFor="period">Payroll Period *</Label>
                        <Select
                            value={formData.period}
                            onValueChange={(value: string) => setFormData({ ...formData, period: value })}
                        >
                            <SelectTrigger id="period">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="February 2024">February 2024</SelectItem>
                                <SelectItem value="March 2024">March 2024</SelectItem>
                                <SelectItem value="April 2024">April 2024</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="basePay">Base Pay (₹) *</Label>
                            <Input
                                id="basePay"
                                type="number"
                                value={formData.basePay}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, basePay: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="overtimePay">Overtime (₹)</Label>
                            <Input
                                id="overtimePay"
                                type="number"
                                value={formData.overtimePay}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, overtimePay: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bonus">Bonus (₹)</Label>
                            <Input
                                id="bonus"
                                type="number"
                                value={formData.bonus}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, bonus: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deductions">Deductions (₹)</Label>
                            <Input
                                id="deductions"
                                type="number"
                                value={formData.deductions}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, deductions: e.target.value })}
                            />
                        </div>
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

                    {(formData.basePay || formData.overtimePay || formData.bonus || formData.deductions) && (
                        <div className="mt-4 p-3 bg-muted rounded-lg border">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Estimated Net Pay:</span>
                                <span className="text-lg font-bold text-primary">
                                    ₹{(Number(formData.basePay || 0) + Number(formData.overtimePay || 0) + Number(formData.bonus || 0) - Number(formData.deductions || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Process Payroll"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
