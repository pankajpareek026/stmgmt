import { connectDB } from '@/lib/db/connect';
import Payroll from '@/lib/models/Payroll';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const payroll = await Payroll.findById(params.id).populate('employeeId', 'name role');

        if (!payroll) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Payroll record not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: payroll
        });
    } catch (error) {
        console.error('Error fetching payroll:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch payroll'
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const body = await request.json();

        let payroll = await Payroll.findById(params.id);

        if (!payroll) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Payroll record not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        payroll = await Payroll.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true
        });

        return NextResponse.json({
            success: true,
            data: payroll
        });
    } catch (error) {
        console.error('Error updating payroll:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update payroll'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const payroll = await Payroll.findById(params.id);

        if (!payroll) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Payroll record not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        await Payroll.findByIdAndDelete(params.id);

        return NextResponse.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting payroll:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete payroll'
            },
            { status: 500 }
        );
    }
}
