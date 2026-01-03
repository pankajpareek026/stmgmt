// Mock data for the construction workforce management app

export interface Project {
  id: string
  name: string
  status: "active" | "completed" | "on-hold" | "planning"
  location: string
  startDate: string
  endDate: string
  budget: number
  spent: number
  completion: number
  manager: string
  workers: number
  description?: string
}

export interface Employee {
  id: string
  name: string
  role: string
  phone: string
  email: string
  dailyRate: number
  status: "active" | "inactive" | "on-leave"
  joinDate: string
  skills: string[]
  projectId?: string
}

export interface Attendance {
  id: string
  employeeId: string
  employeeName: string
  projectId: string
  projectName: string
  date: string
  checkIn: string
  checkOut: string
  hours: number
  status: "present" | "absent" | "half-day" | "overtime"
  overtime: number
}

export interface Payroll {
  id: string
  employeeId: string
  employeeName: string
  period: string
  daysWorked: number
  dailyRate: number
  basePay: number
  overtimePay: number
  bonus: number
  deductions: number
  netPay: number
  status: "pending" | "paid" | "processing"
}

export interface Expense {
  id: string
  category: "materials" | "equipment" | "transport" | "permits" | "other"
  description: string
  amount: number
  projectId: string
  projectName: string
  date: string
  submittedBy: string
  status: "pending" | "approved" | "rejected"
  receipt?: string
}

// Mock Projects
export const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Downtown Office Complex",
    status: "active",
    location: "Downtown, City Center",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    budget: 2500000,
    spent: 1650000,
    completion: 65,
    manager: "John Smith",
    workers: 24,
  },
  {
    id: "p2",
    name: "Residential Tower - Phase 2",
    status: "active",
    location: "Westside District",
    startDate: "2024-02-01",
    endDate: "2024-08-15",
    budget: 3200000,
    spent: 1280000,
    completion: 40,
    manager: "Sarah Johnson",
    workers: 32,
  },
  {
    id: "p3",
    name: "Highway Bridge Repair",
    status: "on-hold",
    location: "Highway 101, Mile 45",
    startDate: "2024-03-10",
    endDate: "2024-05-20",
    budget: 850000,
    spent: 425000,
    completion: 50,
    manager: "Mike Davis",
    workers: 12,
  },
]

// Mock Employees
export const mockEmployees: Employee[] = [
  {
    id: "e1",
    name: "James Wilson",
    role: "Site Supervisor",
    phone: "+1 555-0101",
    email: "james.w@constructwork.com",
    dailyRate: 350,
    status: "active",
    joinDate: "2023-06-15",
    skills: ["Project Management", "Safety Compliance", "Team Leadership"],
    projectId: "p1",
  },
  {
    id: "e2",
    name: "Maria Garcia",
    role: "Electrician",
    phone: "+1 555-0102",
    email: "maria.g@constructwork.com",
    dailyRate: 280,
    status: "active",
    joinDate: "2023-08-20",
    skills: ["Electrical Wiring", "Circuit Design", "Safety Standards"],
    projectId: "p1",
  },
  {
    id: "e3",
    name: "Robert Chen",
    role: "Carpenter",
    phone: "+1 555-0103",
    email: "robert.c@constructwork.com",
    dailyRate: 260,
    status: "active",
    joinDate: "2023-07-10",
    skills: ["Framing", "Finishing", "Blueprint Reading"],
    projectId: "p2",
  },
  {
    id: "e4",
    name: "Lisa Anderson",
    role: "Plumber",
    phone: "+1 555-0104",
    email: "lisa.a@constructwork.com",
    dailyRate: 270,
    status: "active",
    joinDate: "2023-09-05",
    skills: ["Pipe Installation", "Drainage Systems", "Water Supply"],
    projectId: "p2",
  },
]

// Mock Attendance
export const mockAttendance: Attendance[] = [
  {
    id: "a1",
    employeeId: "e1",
    employeeName: "James Wilson",
    projectId: "p1",
    projectName: "Downtown Office Complex",
    date: "2024-01-15",
    checkIn: "07:00",
    checkOut: "17:30",
    hours: 10.5,
    status: "overtime",
    overtime: 2.5,
  },
  {
    id: "a2",
    employeeId: "e2",
    employeeName: "Maria Garcia",
    projectId: "p1",
    projectName: "Downtown Office Complex",
    date: "2024-01-15",
    checkIn: "07:15",
    checkOut: "16:00",
    hours: 8.75,
    status: "present",
    overtime: 0,
  },
]

// Mock Payroll
export const mockPayroll: Payroll[] = [
  {
    id: "pr1",
    employeeId: "e1",
    employeeName: "James Wilson",
    period: "Jan 2024",
    daysWorked: 22,
    dailyRate: 350,
    basePay: 7700,
    overtimePay: 875,
    bonus: 500,
    deductions: 1050,
    netPay: 8025,
    status: "paid",
  },
  {
    id: "pr2",
    employeeId: "e2",
    employeeName: "Maria Garcia",
    period: "Jan 2024",
    daysWorked: 20,
    dailyRate: 280,
    basePay: 5600,
    overtimePay: 420,
    bonus: 0,
    deductions: 840,
    netPay: 5180,
    status: "paid",
  },
]

// Mock Expenses
export const mockExpenses: Expense[] = [
  {
    id: "ex1",
    category: "materials",
    description: "Cement bags (500 units)",
    amount: 12500,
    projectId: "p1",
    projectName: "Downtown Office Complex",
    date: "2024-01-10",
    submittedBy: "John Smith",
    status: "approved",
  },
  {
    id: "ex2",
    category: "equipment",
    description: "Crane rental - 3 days",
    amount: 4800,
    projectId: "p2",
    projectName: "Residential Tower - Phase 2",
    date: "2024-01-12",
    submittedBy: "Sarah Johnson",
    status: "approved",
  },
  {
    id: "ex3",
    category: "transport",
    description: "Material delivery trucks",
    amount: 850,
    projectId: "p1",
    projectName: "Downtown Office Complex",
    date: "2024-01-14",
    submittedBy: "John Smith",
    status: "pending",
  },
]
