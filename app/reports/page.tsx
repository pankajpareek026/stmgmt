import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and view analytical reports</p>
        </div>
        <Button className="sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Project Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View detailed analytics on project progress, budget utilization, and completion rates.
            </p>
            <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>Payroll Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Comprehensive payroll reports including overtime, bonuses, and deductions.
            </p>
            <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Attendance Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track attendance patterns, overtime hours, and workforce availability.
            </p>
            <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <CardTitle>Expense Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyze project expenses by category, status, and time period.
            </p>
            <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <BarChart3 className="h-6 w-6 text-orange-500" />
              </div>
              <CardTitle>Employee Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Evaluate employee productivity, attendance, and contribution metrics.
            </p>
            <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <TrendingUp className="h-6 w-6 text-cyan-500" />
              </div>
              <CardTitle>Financial Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete financial summary including budgets, expenses, and payroll costs.
            </p>
            <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="bg-secondary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Advanced Analytics Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                We're working on adding more advanced reporting features including custom date ranges, comparative
                analysis, data visualization charts, and automated report scheduling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
