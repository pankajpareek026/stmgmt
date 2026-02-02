"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, Users, ClipboardCheck, Wallet, Receipt, BarChart3, Lock, LogOut, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: Users, label: "Employees", href: "/employees" },
  { icon: ClipboardCheck, label: "Attendance", href: "/attendance" },
  { icon: Wallet, label: "Payroll", href: "/payroll" },
  { icon: Receipt, label: "Expenses", href: "/expenses" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/profile/settings" },
  { icon: Lock, label: "Security", href: "/profile/security" },
]

export function DesktopSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="w-10 h-10 relative overflow-hidden rounded-lg">
          <img src="/logo.png" alt="ConstPro Logo" className="object-cover w-full h-full" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none">ConstPro</h1>
          <p className="text-xs text-muted-foreground">Workforce Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            // Implement logout logic here
            window.location.href = '/login'
          }}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  )
}
