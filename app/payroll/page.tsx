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

  if (loading) {
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
  const periods = Array.from(new Set(safePayroll.map((p: Payroll) => p.period)))

  const filteredPayroll = safePayroll.filter((payroll: Payroll) => {
    const matchesSearch = payroll.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || payroll.status === statusFilter
    const matchesPeriod = periodFilter === "all" || payroll.period === periodFilter
    return matchesSearch && matchesStatus && matchesPeriod
  })

  const totalBasePay = filteredPayroll.reduce((sum: number, p: Payroll) => sum + p.basePay, 0)
  const totalNetPay = filteredPayroll.reduce((sum: number, p: Payroll) => sum + p.netPay, 0)
  const totalOvertimePay = filteredPayroll.reduce((sum: number, p: Payroll) => sum + p.overtimePay, 0)
  const totalBonus = filteredPayroll.reduce((sum: number, p: Payroll) => sum + p.bonus, 0)

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
            Process Payroll
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
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">${totalNetPay.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">${totalBasePay.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">${totalOvertimePay.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{filteredPayroll.length}</p>
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
                <TableHead>Period</TableHead>
                <TableHead>Days Worked</TableHead>
                <TableHead>Base Pay</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayroll.length > 0 ? (
                filteredPayroll.map((payroll: Payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {payroll.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{payroll.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{payroll.period}</TableCell>
                    <TableCell>{payroll.daysWorked}</TableCell>
                    <TableCell className="font-medium">${payroll.basePay.toLocaleString()}</TableCell>
                    <TableCell className="text-blue-500">${payroll.overtimePay.toLocaleString()}</TableCell>
                    <TableCell className="text-green-500">${payroll.bonus.toLocaleString()}</TableCell>
                    <TableCell className="text-red-500">-${payroll.deductions.toLocaleString()}</TableCell>
                    <TableCell className="font-bold">${payroll.netPay.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusColors[payroll.status as keyof typeof statusColors])}>
                        {payroll.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {payroll.status !== "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-green-500 border-green-500/20 bg-transparent"
                            onClick={() => handleStatusUpdate(payroll.id, "paid")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-destructive border-destructive/20 bg-transparent"
                          onClick={() => handleDelete(payroll.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
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
        {filteredPayroll.length > 0 ? (
          filteredPayroll.map((payroll: Payroll) => (
            <Card key={payroll.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {payroll.employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{payroll.employeeName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{payroll.period}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(statusColors[payroll.status as keyof typeof statusColors])}>
                    {payroll.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Days Worked</span>
                    <span className="font-medium">{payroll.daysWorked}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Base Pay</span>
                    <span className="font-medium">${payroll.basePay.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overtime</span>
                    <span className="font-medium text-blue-500">+${payroll.overtimePay.toLocaleString()}</span>
                  </div>
                  {payroll.bonus > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bonus</span>
                      <span className="font-medium text-green-500">+${payroll.bonus.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="font-medium text-red-500">-${payroll.deductions.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-semibold">Net Pay</span>
                  <span className="text-xl font-bold text-primary">${payroll.netPay.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No payroll records found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payroll Summary */}
      {filteredPayroll.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Days Worked</p>
                <p className="text-2xl font-bold">{filteredPayroll.reduce((sum: number, p: Payroll) => sum + p.daysWorked, 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Bonuses</p>
                <p className="text-2xl font-bold text-green-500">${totalBonus.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Deductions</p>
                <p className="text-2xl font-bold text-red-500">
                  ${filteredPayroll.reduce((sum: number, p: Payroll) => sum + p.deductions, 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Net Pay</p>
                <p className="text-2xl font-bold">
                  ${Math.round(totalNetPay / filteredPayroll.length).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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
