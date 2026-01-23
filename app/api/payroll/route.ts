import { connectDB } from '@/lib/db/connect';
import Payroll from '@/lib/models/Payroll';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const payrolls = await Payroll.find().populate('employeeId', 'name role');

        return NextResponse.json({
            success: true,
            count: payrolls.length,
            data: payrolls
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

        // Validation
        if (
            !body.employeeId ||
            !body.netPay ||
            !body.paymentDate
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: employeeId, netPay, paymentDate'
                },
                { status: 400 }
            );
        }

        const payroll = await Payroll.create(body);

        return NextResponse.json(
            {
                success: true,
                data: payroll
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating payroll:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create payroll'
            },
            { status: 500 }
        );
    }
}
