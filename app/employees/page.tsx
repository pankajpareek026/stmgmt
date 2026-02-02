"use client"

import { Suspense, useState } from "react"
import { Plus, Search, Filter, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmployeeCard } from "@/components/employee-card"
import { AddEmployeeDialog } from "@/components/add-employee-dialog"
import { useApi } from "@/hooks/use-api"
import { Employee } from "@/lib/mock-data"
import { useCurrency } from "@/components/currency-provider"

function EmployeesContent() {
  const { formatCurrency } = useCurrency()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showAddEmployee, setShowAddEmployee] = useState(false)

  const { data: employees, loading, error, refresh } = useApi<Employee[]>("/employees")
  const { data: allStats } = useApi<any>("/employees/stats")

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading employees...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 text-destructive text-center">
        <h2 className="text-xl font-bold mb-2">Error Loading Employees</h2>
        <p>{error}</p>
      </div>
    )
  }

  const safeEmployees = employees || []

  const filteredEmployees = safeEmployees.filter((employee: Employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    const matchesRole = roleFilter === "all" || employee.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const uniqueRoles = Array.from(new Set(safeEmployees.map((e: Employee) => e.role)))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your workforce and team members</p>
        </div>
        <Button className="sm:w-auto" onClick={() => setShowAddEmployee(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or email..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on-leave">On Leave</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl font-bold mt-1">{safeEmployees.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold mt-1 text-green-500">
            {safeEmployees.filter((e: Employee) => e.status === "active").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">On Leave</p>
          <p className="text-2xl font-bold mt-1 text-yellow-500">
            {safeEmployees.filter((e: Employee) => e.status === "on-leave").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Avg Daily Rate</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(
              safeEmployees.length > 0
                ? Number(
                  (
                    safeEmployees.reduce((sum: number, e: Employee) => sum + e.dailyRate, 0) /
                    safeEmployees.length
                  ).toFixed(0),
                )
                : 0,
            )}
          </p>
        </div>
      </div>

      {/* Employees Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee: Employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              stats={allStats?.data?.[employee.id || (employee as any)._id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No employees found matching your criteria</p>
        </div>
      )}
      <AddEmployeeDialog
        open={showAddEmployee}
        onOpenChange={setShowAddEmployee}
        onSaveSuccess={() => refresh()}
      />
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={null}>
      <EmployeesContent />
    </Suspense>
  )
}
