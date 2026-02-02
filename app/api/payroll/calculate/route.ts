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

        // Get employee daily rate
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }
        const dailyRate = employee.dailyRate || 0;

        // Get ALL Attendance earnings for this employee and project (regardless of month/date)
        const attendanceDocs = await Attendance.find({
            employeeId: new mongoose.Types.ObjectId(employeeId),
            projectId: new mongoose.Types.ObjectId(projectId)
        }).sort({ date: 1 }); // Sort by date ascending

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

        // Get ALL Already Paid amounts from ALL Payroll History (across all months)
        const allPayrollDocs = await Payroll.find({
            employeeId: new mongoose.Types.ObjectId(employeeId)
        });

        let alreadyPaid = 0;
        const allPastPayments: any[] = [];

        if (allPayrollDocs && allPayrollDocs.length > 0) {
            const targetProjId = projectId.trim();

            allPayrollDocs.forEach(doc => {
                if (doc.payments && doc.payments.length > 0) {
                    doc.payments.forEach((p: any) => {
                        const pProjId = p.projectId ? p.projectId.toString().trim() : "";

                        // Include if payment matches THIS project OR if it's a general payment (no project ID)
                        if (pProjId === targetProjId || pProjId === "") {
                            alreadyPaid += p.amount;
                            allPastPayments.push({
                                amount: p.amount,
                                paymentDate: p.paymentDate,
                                description: p.description,
                                isGeneral: !p.projectId
                            });
                        }
                    });
                }
            });
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
            pastPayments: allPastPayments.sort((a, b) =>
                new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
            )
        });

    } catch (error: any) {
        console.error("Calculation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to calculate payroll" }, { status: 500 });
    }
}
