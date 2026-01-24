import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Attendance from "@/lib/models/Attendance";
import Payroll from "@/lib/models/Payroll";
import Employee from "@/lib/models/Employee";
import Project from "@/lib/models/Project";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        // 1. Get all employees to know their daily rates
        const employees = await Employee.find();
        const employeeMap = new Map();
        employees.forEach(emp => {
            employeeMap.set(emp._id.toString(), {
                name: emp.name,
                dailyRate: emp.dailyRate || 0
            });
        });

        // 2. Aggregate Attendance earnings per employee per project
        const attendanceStats = await Attendance.aggregate([
            {
                $group: {
                    _id: {
                        employeeId: "$employeeId",
                        projectId: "$projectId"
                    },
                    presentDays: {
                        $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
                    },
                    halfDays: {
                        $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] }
                    }
                }
            }
        ]);

        // 3. Aggregate Payroll payments per employee per project
        const payrollDocs = await Payroll.find();

        // Initialize the final stats nested object
        // Format: { employeeId: { projectId: { totalEarned, totalPaid, netDue, projectName } } }
        const stats: any = {};

        // Process Attendance first to establish base earnings
        attendanceStats.forEach(item => {
            const empId = item._id.employeeId.toString();
            const projId = item._id.projectId.toString();
            const empData = employeeMap.get(empId);

            if (!empData) return;

            const totalEarned = (item.presentDays * empData.dailyRate) + (item.halfDays * (empData.dailyRate / 2));

            if (!stats[empId]) stats[empId] = {};
            stats[empId][projId] = {
                totalEarned,
                totalPaid: 0,
                netDue: totalEarned
            };
        });

        // Process Payroll to subtract payments
        payrollDocs.forEach(doc => {
            const empId = doc.employeeId.toString();
            if (!stats[empId]) stats[empId] = {};

            (doc.payments || []).forEach((p: any) => {
                const projId = p.projectId ? p.projectId.toString() : "general";

                if (!stats[empId][projId]) {
                    stats[empId][projId] = { totalEarned: 0, totalPaid: 0, netDue: 0 };
                }

                stats[empId][projId].totalPaid += p.amount;
                stats[empId][projId].netDue = stats[empId][projId].totalEarned - stats[empId][projId].totalPaid;
            });
        });

        // Add project names for convenience
        const projects = await Project.find({}, "name");
        const projectMap: any = { "general": "General Advance / Other" };
        projects.forEach(p => projectMap[p._id.toString()] = p.name);

        Object.keys(stats).forEach(empId => {
            Object.keys(stats[empId]).forEach(projId => {
                stats[empId][projId].projectName = projectMap[projId] || "Unknown Project";
            });
        });

        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error: any) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
    }
}
