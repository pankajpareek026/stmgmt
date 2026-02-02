"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calculator, Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useApi } from "@/hooks/use-api"
import { Employee, Project, Attendance, Payroll } from "@/lib/mock-data"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { useCurrency } from "@/components/currency-provider"

interface ProcessPayrollDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveSuccess?: () => void
    initialEmployeeId?: string
    initialProjectId?: string
}

export function ProcessPayrollDialog({ open, onOpenChange, onSaveSuccess, initialEmployeeId, initialProjectId }: ProcessPayrollDialogProps) {
    const { currency, formatCurrency } = useCurrency()
    const [isSaving, setIsSaving] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showBreakdown, setShowBreakdown] = useState(false)
    const [showDetailedHistory, setShowDetailedHistory] = useState(false)
    const { data: employees, loading: employeesLoading } = useApi<Employee[]>("/employees")
    const { data: projects, loading: projectsLoading } = useApi<Project[]>("/projects")
    const { data: attendanceDocs } = useApi<Attendance[]>("/attendance")
    const { data: payrollDocs } = useApi<Payroll[]>("/payroll")

    const [formData, setFormData] = useState({
        employeeId: initialEmployeeId || "",
        projectId: initialProjectId || "",
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        description: "",
        status: "paid",
        type: "adhoc" // adhoc, salary, advance
    })

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setIsSuccess(false)
            setError(null)
            setFormData({
                employeeId: initialEmployeeId || "",
                projectId: initialProjectId || "",
                amount: "",
                paymentDate: new Date().toISOString().split('T')[0],
                description: "",
                status: "paid",
                type: "adhoc"
            })
        }
    }, [open, initialEmployeeId, initialProjectId])

    // Update state if initialEmployeeId changes
    useEffect(() => {
        if (initialEmployeeId && formData.employeeId !== initialEmployeeId) {
            setFormData(prev => ({ ...prev, employeeId: initialEmployeeId }))
        }
    }, [initialEmployeeId])

    const [calculationBreakdown, setCalculationBreakdown] = useState<any>({
        totalEarned: 0,
        alreadyPaid: 0,
        netDue: 0,
        daysPresent: 0,
        daysHalfDay: 0,
        dailyRate: 0,
        attendanceRecords: [],
        pastPayments: []
    })
    const [isCalculating, setIsCalculating] = useState(false)

    // Fetch calculation from backend when relevant fields change
    useEffect(() => {
        const fetchCalculation = async () => {
            if (!formData.employeeId || !formData.projectId || !formData.paymentDate) {
                setCalculationBreakdown({
                    totalEarned: 0,
                    alreadyPaid: 0,
                    netDue: 0,
                    daysPresent: 0,
                    daysHalfDay: 0,
                    dailyRate: 0,
                    attendanceRecords: [],
                    pastPayments: []
                })
                return
            }

            setIsCalculating(true)
            try {
                const response = await apiService.get(`/payroll/calculate?employeeId=${formData.employeeId}&projectId=${formData.projectId}&paymentDate=${formData.paymentDate}`)
                if (response) {
                    setCalculationBreakdown(response)
                }
            } catch (err) {
                console.error("Failed to fetch calculation:", err)
                toast.error("Failed to fetch accurate due amount from server")
            } finally {
                setIsCalculating(false)
            }
        }

        fetchCalculation()
    }, [formData.employeeId, formData.projectId, formData.paymentDate])

    const calculatedPay = calculationBreakdown?.netDue || 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!formData.employeeId || !formData.amount || !formData.paymentDate || !formData.projectId) {
            setError("Please fill in all required fields (Employee, Project, Amount, Date)")
            return
        }

        setIsSaving(true)
        try {
            await apiService.post("/payroll", {
                employeeId: formData.employeeId,
                projectId: formData.projectId || undefined,
                amount: Number(formData.amount),
                paymentDate: formData.paymentDate,
                description: formData.description
            })
            // Show success view FIRST to ensure it renders before any parent re-renders
            setIsSuccess(true)

            // Update parent
            onSaveSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to record payment")
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isSuccess ? "Payment Successful" : "Record Payment"}</DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-green-700 mb-1">Payment Successful!</h3>
                        <p className="text-muted-foreground mb-6">The payroll record has been updated.</p>

                        <Card className="w-full bg-muted/30 border-dashed mb-6">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Employee</span>
                                    <span className="font-medium">{(employees || []).find(e => e.id === formData.employeeId)?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Amount Paid</span>
                                    <span className="font-bold text-green-600">{formatCurrency(Number(formData.amount) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Project</span>
                                    <span className="font-medium">
                                        {(projects || []).find(p => (p.id === formData.projectId || (p as any)._id === formData.projectId))?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Date</span>
                                    <span className="font-medium">{new Date(formData.paymentDate).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col w-full gap-2">
                            <Button className="w-full" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                            <Button variant="outline" className="w-full bg-transparent" onClick={() => {
                                setIsSuccess(false)
                                setFormData({
                                    employeeId: "",
                                    projectId: "",
                                    amount: "",
                                    paymentDate: new Date().toISOString().split("T")[0],
                                    description: "",
                                    status: "paid",
                                    type: "adhoc"
                                })
                            }}>
                                Record Another
                            </Button>
                        </div>
                    </div>
                ) : (
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
                            <DatePicker
                                date={formData.paymentDate ? new Date(formData.paymentDate) : undefined}
                                setDate={(date) => setFormData({
                                    ...formData,
                                    paymentDate: date ? date.toISOString().split('T')[0] : ""
                                })}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Showing total outstanding balance (all time)
                            </p>
                        </div>

                        {formData.employeeId && formData.projectId && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="flex items-center justify-between w-full p-2 text-xs font-semibold bg-muted/50 rounded-lg hover:bg-muted transition-colors border"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-3 w-3 text-muted-foreground" />
                                        <span>Calculation Breakdown</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isCalculating ? (
                                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                        ) : (
                                            <>
                                                <span className="text-green-600">{formatCurrency(calculationBreakdown?.netDue || 0)}</span>
                                                {showBreakdown ? (
                                                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </button>

                                {showBreakdown && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-t-0 -mt-3 pt-4 text-xs space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex justify-between font-semibold border-b pb-1 mb-1">
                                            <span>Factor</span>
                                            <span>Amount</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Days Present ({calculationBreakdown?.daysPresent || 0} × {formatCurrency(calculationBreakdown?.dailyRate || 0)})</span>
                                            <span>{formatCurrency((calculationBreakdown?.daysPresent || 0) * (calculationBreakdown?.dailyRate || 0))}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Half Days ({calculationBreakdown?.daysHalfDay || 0} × {formatCurrency((calculationBreakdown?.dailyRate || 0) / 2)})</span>
                                            <span>{formatCurrency((calculationBreakdown?.daysHalfDay || 0) * ((calculationBreakdown?.dailyRate || 0) / 2))}</span>
                                        </div>
                                        <div className="flex justify-between text-blue-600 font-medium">
                                            <span>Total Gross Earned (All Time)</span>
                                            <span>{formatCurrency(calculationBreakdown?.totalEarned || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-500">
                                            <span>Already Paid (All Time)</span>
                                            <span>- {formatCurrency(calculationBreakdown?.alreadyPaid || 0)}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 font-bold text-green-600 text-sm">
                                            <span>Total Outstanding Balance</span>
                                            <span>{formatCurrency(calculationBreakdown?.netDue || 0)}</span>
                                        </div>

                                        <div className="pt-2 mt-2 border-t border-dashed">
                                            <button
                                                type="button"
                                                onClick={() => setShowDetailedHistory(!showDetailedHistory)}
                                                className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
                                            >
                                                {showDetailedHistory ? "Hide Detailed Logs" : "View All Transactions & Calculations"}
                                            </button>

                                            {showDetailedHistory && (
                                                <div className="pt-3 space-y-4 animate-in fade-in duration-300">
                                                    {/* Attendance List */}
                                                    <div>
                                                        <p className="font-bold mb-2 uppercase text-[9px] text-muted-foreground tracking-wider bg-muted/50 p-1 rounded">Complete Attendance History (All Time)</p>
                                                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                            {calculationBreakdown?.attendanceRecords?.length > 0 ? (
                                                                calculationBreakdown.attendanceRecords.map((rec: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center py-1 border-b border-border/10 last:border-0 opacity-90">
                                                                        <span>{new Date(rec.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} • <span className="capitalize">{rec.status}</span></span>
                                                                        <span className="font-medium text-blue-600">{formatCurrency(rec.amount)}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-[10px] italic opacity-50 py-1">No attendance records found for this period.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Past Payments List */}
                                                    <div>
                                                        <p className="font-bold mb-2 uppercase text-[9px] text-muted-foreground tracking-wider bg-muted/50 p-1 rounded">Complete Payment History (All Time)</p>
                                                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                            {calculationBreakdown?.pastPayments?.length > 0 ? (
                                                                calculationBreakdown.pastPayments.map((p: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-start py-1 border-b border-border/10 last:border-0 opacity-90">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">{new Date(p.paymentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} {p.isGeneral && <Badge variant="outline" className="text-[8px] py-0 px-1 ml-1 h-3 border-yellow-500/30 text-yellow-600">General Advance</Badge>}</span>
                                                                            {p.description && <span className="text-[9px] opacity-70 italic leading-tight">{p.description}</span>}
                                                                        </div>
                                                                        <span className="font-bold text-red-500 ml-2">-{formatCurrency(p.amount)}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-[10px] italic opacity-50 py-1">No prior payments or advances recorded.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Amount Block with Calculation */}
                        <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                                <Label htmlFor="amount" className="text-base">Amount to Pay ({currency.symbol}) *</Label>
                                {isCalculating ? (
                                    <Badge variant="outline" className="bg-background text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Calculating...
                                    </Badge>
                                ) : calculatedPay > 0 ? (
                                    <Badge variant="outline" className="bg-background text-green-600 border-green-200">
                                        Attendance Due: {formatCurrency(calculatedPay)}
                                    </Badge>
                                ) : null}
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
                )}
            </DialogContent>
        </Dialog>
    )
}
