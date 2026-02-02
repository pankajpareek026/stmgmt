"use client"

import { Suspense, useState } from "react"
import { Plus, Search, Download, Receipt, TrendingUp, CheckCircle, Clock, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddExpenseDialog } from "@/components/add-expense-dialog"
import { useApi } from "@/hooks/use-api"
import { Expense, Project } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/currency-provider"
import { apiService } from "@/lib/api-service"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

const statusColors = {
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

const categoryColors: Record<string, string> = {
  Materials: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Labor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Equipment: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Transport: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Permits: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  Utilities: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  Other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

function ExpensesContent() {
  const { formatCurrency } = useCurrency()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [showAddExpense, setShowAddExpense] = useState(false)

  const { data: expensesData, loading: expensesLoading, error: expensesError, refresh: refreshExpenses } = useApi<Expense[]>("/expenses")
  const { data: projectsData, loading: projectsLoading } = useApi<Project[]>("/projects")

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    try {
      await apiService.put(`/expenses/${id}`, { status })
      toast.success(`Expense ${status}`)
      refreshExpenses()
    } catch (err) {
      toast.error(`Failed to ${status === "approved" ? "approve" : "reject"} expense`)
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await apiService.delete(`/expenses/${id}`)
        toast.success("Expense deleted successfully")
        refreshExpenses()
      } catch (err) {
        toast.error("Failed to delete expense")
        console.error(err)
      }
    }
  }

  if (expensesLoading || projectsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading expenses data...</span>
      </div>
    )
  }

  if (expensesError) {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 text-destructive text-center">
        <h2 className="text-xl font-bold mb-2">Error Loading Expenses</h2>
        <p>{expensesError}</p>
      </div>
    )
  }

  const safeExpenses = expensesData || []
  const safeProjects = projectsData || []

  const filteredExpenses = safeExpenses.filter((expense: Expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    const matchesProject = projectFilter === "all" || expense.projectId === projectFilter
    return matchesSearch && matchesStatus && matchesCategory && matchesProject
  })

  const totalExpenses = filteredExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0)
  const approvedExpenses = filteredExpenses.filter((e: Expense) => e.status === "approved")
  const pendingExpenses = filteredExpenses.filter((e: Expense) => e.status === "pending")
  const totalApproved = approvedExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0)
  const totalPending = pendingExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and manage project expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="sm:w-auto bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="sm:w-auto" onClick={() => setShowAddExpense(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{formatCurrency(totalApproved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
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
                <p className="text-sm text-muted-foreground">Avg Expense</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    filteredExpenses.length > 0 ? Math.round(totalExpenses / filteredExpenses.length) : 0,
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description or project..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="permits">Permits</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {safeProjects.map((project: Project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expense Table - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense: Expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(categoryColors[expense.category])}>
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{expense.projectName}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{expense.submittedBy}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusColors[expense.status as keyof typeof statusColors])}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {expense.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-green-500 border-green-500/20 bg-transparent"
                              onClick={() => handleStatusUpdate(expense.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-red-500 border-red-500/20 bg-transparent"
                              onClick={() => handleStatusUpdate(expense.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-destructive border-destructive/20 bg-transparent"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No expense records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense: Expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{expense.description}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{expense.projectName}</p>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 ml-2", statusColors[expense.status])}>
                    {expense.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className={cn(categoryColors[expense.category])}>
                    {expense.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted by</p>
                    <p className="text-sm font-medium">{expense.submittedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(expense.amount)}</p>
                  </div>
                </div>

                {expense.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent text-green-500 border-green-500/20"
                      onClick={() => handleStatusUpdate(expense.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent text-red-500 border-red-500/20"
                      onClick={() => handleStatusUpdate(expense.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No expense records found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expense Breakdown by Category */}
      {filteredExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {(["materials", "equipment", "transport", "permits", "other"] as const).map((category) => {
                const categoryExpenses = filteredExpenses.filter((e: Expense) => e.category === category)
                const categoryTotal = categoryExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0)
                const categoryPercent = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={cn(categoryColors[category])}>
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{categoryExpenses.length}</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${categoryTotal.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{categoryPercent.toFixed(1)}% of total</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onSaveSuccess={() => refreshExpenses()}
      />
    </div>
  )
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesContent />
    </Suspense>
  )
}
