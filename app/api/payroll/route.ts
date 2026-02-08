import { connectDB } from '@/lib/db/connect';
import Payroll from '@/lib/models/Payroll';
import '@/lib/models/Employee'; // Register for populate
import '@/lib/models/Project';  // Register for populate
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const payrolls = await Payroll.find()
            .populate('employeeId', 'name role')
            .populate('payments.projectId', 'name');

        const transformedPayrolls = payrolls.map((p: any) => {
            const doc = p.toObject ? p.toObject() : p;
            return {
                ...doc,
                id: doc.id || doc._id?.toString() || doc._id
            };
        });

        return NextResponse.json({
            success: true,
            count: transformedPayrolls.length,
            data: transformedPayrolls
        });
    } catch (error) {
        console.error('Error fetching payrolls:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch payrolls'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { employeeId, amount, paymentDate, projectId, description } = body;

        // Validation
        if (!employeeId || !amount || !paymentDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: employeeId, amount, paymentDate' },
                { status: 400 }
            );
        }

        const date = new Date(paymentDate);
        const month = date.getMonth();
        const year = date.getFullYear();
        const period = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Check if a payment for this employee/project/date/amount already exists in the array
        const existingDoc = await Payroll.findOne({
            employeeId,
            month,
            year
        });

        if (existingDoc) {
            const isDuplicate = existingDoc.payments.some((p: any) => {
                const sameDate = new Date(p.paymentDate).toISOString().split('T')[0] === new Date(paymentDate).toISOString().split('T')[0];
                const sameAmount = p.amount === Number(amount);
                const pProjId = p.projectId ? p.projectId.toString() : null;
                const bodyProjId = projectId || null;
                return sameDate && sameAmount && pProjId === bodyProjId;
            });

            if (isDuplicate) {
                return NextResponse.json(
                    { success: false, error: 'A duplicate payment record already exists for this date and amount.' },
                    { status: 400 }
                );
            }
        }

        const newPayment = {
            amount: Number(amount),
            paymentDate: new Date(paymentDate),
            projectId: projectId || undefined,
            description: description || ""
        };

        const payroll = await Payroll.findOneAndUpdate(
            { employeeId, month, year },
            {
                $set: { period },
                $push: { payments: newPayment },
                $inc: { totalPaid: Number(amount) },
                status: 'paid'
            },
            { upsert: true, new: true, runValidators: true }
        );

        return NextResponse.json(
            {
                success: true,
                data: payroll
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating/updating payroll:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to record payment'
            },
            { status: 500 }
        );
    }
}
