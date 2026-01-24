import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Attendance from "@/lib/models/Attendance";
import Payroll from "@/lib/models/Payroll";
import Employee from "@/lib/models/Employee";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get("employeeId");
        const projectId = searchParams.get("projectId");
        const paymentDate = searchParams.get("paymentDate");

        if (!employeeId || !projectId || !paymentDate) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const date = new Date(paymentDate);
        const month = date.getMonth();
        const year = date.getFullYear();

        // Get employee daily rate
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }
        const dailyRate = employee.dailyRate || 0;

        // Calculate Month Start and End for attendance query
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        // Get Attendance earnings for this project in this month
        const attendanceDocs = await Attendance.find({
            employeeId: new mongoose.Types.ObjectId(employeeId),
            projectId: new mongoose.Types.ObjectId(projectId),
            date: { $gte: monthStart, $lte: monthEnd }
        });

        let daysPresent = 0;
        let daysHalfDay = 0;
        let totalEarned = 0;

        attendanceDocs.forEach(att => {
            if (att.status === 'present') {
                totalEarned += dailyRate;
                daysPresent++;
            } else if (att.status === 'half-day') {
                totalEarned += (dailyRate / 2);
                daysHalfDay++;
            }
        });

        // Get Already Paid from Aggregated Payroll History
        const monthlyPayrollDoc = await Payroll.findOne({
            employeeId: new mongoose.Types.ObjectId(employeeId),
            month,
            year
        });

        let alreadyPaid = 0;
        if (monthlyPayrollDoc && monthlyPayrollDoc.payments) {
            const targetProjId = projectId.trim();
            alreadyPaid = monthlyPayrollDoc.payments.reduce((sum: number, p: any) => {
                const pProjId = p.projectId ? p.projectId.toString().trim() : "";

                // Deduct if payment matches THIS project 
                // OR if it's a general payment (no project ID)
                if (pProjId === targetProjId || pProjId === "") {
                    return sum + p.amount;
                }
                return sum;
            }, 0);
        }

        const netDue = Math.max(0, totalEarned - alreadyPaid);

        return NextResponse.json({
            totalEarned,
            alreadyPaid,
            netDue,
            daysPresent,
            daysHalfDay,
            dailyRate,
            attendanceRecords: attendanceDocs.map(att => ({
                date: att.date,
                status: att.status,
                amount: att.status === 'present' ? dailyRate : (att.status === 'half-day' ? dailyRate / 2 : 0)
            })),
            pastPayments: (monthlyPayrollDoc?.payments || []).filter((p: any) => {
                const pProjId = p.projectId ? p.projectId.toString().trim() : "";
                return pProjId === projectId.trim() || pProjId === "";
            }).map((p: any) => ({
                amount: p.amount,
                paymentDate: p.paymentDate,
                description: p.description,
                isGeneral: !p.projectId
            }))
        });

    } catch (error: any) {
        console.error("Calculation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to calculate payroll" }, { status: 500 });
    }
}
