import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Attendance from "@/lib/models/Attendance";
import Payroll from "@/lib/models/Payroll";
import Employee from "@/lib/models/Employee";
import Project from "@/lib/models/Project";
import mongoose from "mongoose";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        // 1. Get employee for daily rate
        const employee = await Employee.findById(id);
        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }
        const dailyRate = employee.dailyRate || 0;

        // 2. Aggregate Attendance earnings per project for this employee
        const attendanceStats = await Attendance.aggregate([
            {
                $match: { employeeId: new mongoose.Types.ObjectId(id) }
            },
            {
                $group: {
                    _id: "$projectId",
                    presentDays: {
                        $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
                    },
                    halfDays: {
                        $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] }
                    },
                    totalHours: { $sum: "$hours" }
                }
            }
        ]);

        // 3. Get all Payroll docs for this employee
        const payrollDocs = await Payroll.find({ employeeId: new mongoose.Types.ObjectId(id) });

        // Initialize stats map
        // { projectId: { totalEarned, totalPaid, netDue, projectName, attendanceCount } }
        const stats: any = {};

        // Process Attendance
        attendanceStats.forEach(item => {
            const projId = item._id.toString();
            const totalEarned = (item.presentDays * dailyRate) + (item.halfDays * (dailyRate / 2));

            stats[projId] = {
                totalEarned,
                totalPaid: 0,
                netDue: totalEarned,
                attendanceCount: item.presentDays + item.halfDays,
                totalHours: item.totalHours
            };
        });

        // Process Payroll
        payrollDocs.forEach(doc => {
            (doc.payments || []).forEach((p: any) => {
                const projId = p.projectId ? p.projectId.toString() : "general";

                if (!stats[projId]) {
                    stats[projId] = { totalEarned: 0, totalPaid: 0, netDue: 0, attendanceCount: 0, totalHours: 0 };
                }

                stats[projId].totalPaid += p.amount;
                stats[projId].netDue = stats[projId].totalEarned - stats[projId].totalPaid;
            });
        });

        // Add project names
        const projectIds = Object.keys(stats).filter(pid => pid !== "general");
        const projects = await Project.find({ _id: { $in: projectIds } }, "name");
        const projectMap: any = { "general": "General Advance / Other" };
        projects.forEach(p => projectMap[p._id.toString()] = p.name);

        const result = Object.keys(stats).map(projId => ({
            projectId: projId,
            projectName: projectMap[projId] || "Deleted/Unknown Project",
            ...stats[projId]
        }));

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error("Employee Stats API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch employee stats" }, { status: 500 });
    }
}
