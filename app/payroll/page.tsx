"use client"

import { Suspense, useState } from "react"
import { Plus, Search, Download, DollarSign, TrendingUp, Users, CalendarIcon, Loader2, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProcessPayrollDialog } from "@/components/process-payroll-dialog"
import { useApi } from "@/hooks/use-api"
import { Payroll } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api-service"
import { toast } from "sonner"
// Removed redundant Check import here if it was separate before

const statusColors = {
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
}

function PayrollContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [showProcessPayroll, setShowProcessPayroll] = useState(false)

  const { data: payrollData, loading, error, refresh: refreshPayroll } = useApi<Payroll[]>("/payroll")

  const handleStatusUpdate = async (id: string, status: "paid") => {
    try {
      await apiService.put(`/payroll/${id}`, { status })
      toast.success(`Payroll marked as ${status}`)
      refreshPayroll()
    } catch (err) {
      toast.error(`Failed to update payroll status`)
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this payroll record?")) {
      try {
        await apiService.delete(`/payroll/${id}`)
        toast.success("Payroll record deleted successfully")
        refreshPayroll()
      } catch (err) {
        toast.error("Failed to delete payroll record")
        console.error(err)
      }
    }
  }

  if (loading && !payrollData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading payroll data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 text-destructive text-center">
        <h2 className="text-xl font-bold mb-2">Error Loading Payroll</h2>
        <p>{error}</p>
      </div>
    )
  }

  const safePayroll = payrollData || []

  // Flatten payments for the transaction view
  const flattenedTransactions = safePayroll.flatMap((doc: any) =>
    (doc.payments || []).map((p: any) => ({
      ...p,
      id: p._id || p.id,
      employeeId: doc.employeeId,
      period: doc.period,
      status: doc.status,
      docId: doc.id || doc._id
    }))
  )

  // Helper to safely get employee name from populated or mock data
  const getPayrollEmployeeName = (p: any) => {
    return p.employeeId?.name || "Unknown Employee"
  }

  // Helper to safely get period or date
  const getPayrollPeriod = (p: any) => {
    return p.period || "Unknown Period"
  }

  const periods = Array.from(new Set(safePayroll.map((p: any) => getPayrollPeriod(p))))

  const filteredTransactions = flattenedTransactions.filter((tx: any) => {
    const empName = getPayrollEmployeeName(tx)
    const periodName = getPayrollPeriod(tx)

    const matchesSearch = (empName || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter
    const matchesPeriod = periodFilter === "all" || periodName === periodFilter
    return matchesSearch && matchesStatus && matchesPeriod
  })

  const totalNetPay = filteredTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0)
  const totalBasePay = 0 // Combined in monthly aggregates
  const totalOvertimePay = 0
  const totalBonus = 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Payroll</h1>
          <p className="text-muted-foreground mt-1">Manage employee salaries and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="sm:w-auto bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="sm:w-auto" onClick={() => setShowProcessPayroll(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payout</p>
                <p className="text-2xl font-bold">₹{totalNetPay.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Base Pay</p>
                <p className="text-2xl font-bold">₹{totalBasePay.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overtime Pay</p>
                <p className="text-2xl font-bold">₹{totalOvertimePay.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {periods.map((period) => (
                <SelectItem key={period as string} value={period as string}>
                  {period as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payroll Table - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date/Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx: any) => {
                  const empName = getPayrollEmployeeName(tx)
                  const periodName = getPayrollPeriod(tx)
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {empName
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium block">{empName}</span>
                            {tx.description && <span className="text-xs text-muted-foreground">{tx.description}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{periodName}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal">Payment</Badge></TableCell>
                      <TableCell className="font-bold">₹{tx.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(statusColors[tx.status as keyof typeof statusColors])}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-destructive border-destructive/20 bg-transparent"
                            onClick={() => handleDelete(tx.docId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No payroll records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payroll Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx: any) => {
            const empName = getPayrollEmployeeName(tx)
            const periodName = getPayrollPeriod(tx)
            return (
              <Card key={tx.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {empName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{empName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{periodName}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(statusColors[tx.status as keyof typeof statusColors])}>
                      {tx.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-b border-dashed">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold">₹{tx.amount.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive border-destructive/20 bg-transparent"
                      onClick={() => handleDelete(tx.docId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
            <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground">No payroll records found</p>
          </div>
        )}
      </div>
      <ProcessPayrollDialog
        open={showProcessPayroll}
        onOpenChange={setShowProcessPayroll}
        onSaveSuccess={() => refreshPayroll()}
      />
    </div>
  )
}

export default function PayrollPage() {
  return (
    <Suspense fallback={null}>
      <PayrollContent />
    </Suspense>
  )
}
