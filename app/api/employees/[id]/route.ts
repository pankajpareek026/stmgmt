import { connectDB } from '@/lib/db/connect';
import Employee from '@/lib/models/Employee';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const employee = await Employee.findById(id).populate('projectId', 'name');

        if (!employee) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Employee not found with id of ${id}`
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: employee
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch employee'
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const body = await request.json();

        let employee = await Employee.findById(id);

        if (!employee) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Employee not found with id of ${id}`
                },
                { status: 404 }
            );
        }

        employee = await Employee.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true
        });

        return NextResponse.json({
            success: true,
            data: employee
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update employee'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const employee = await Employee.findById(id);

        if (!employee) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Employee not found with id of ${id}`
                },
                { status: 404 }
            );
        }

        await Employee.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete employee'
            },
            { status: 500 }
        );
    }
}
