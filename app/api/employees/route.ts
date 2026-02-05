import { connectDB } from '@/lib/db/connect';
import Employee from '@/lib/models/Employee';
import '@/lib/models/Project'; // Ensure Project model is registered for populate
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const employees = await Employee.find().populate('projectIds', 'name');

        return NextResponse.json({
            success: true,
            count: employees.length,
            data: employees
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch employees'
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
        if (!body.name || !body.role || body.dailyRate === undefined) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: name, role, dailyRate'
                },
                { status: 400 }
            );
        }

        // Convert joinDate string to Date object if provided
        if (body.joinDate && typeof body.joinDate === 'string') {
            body.joinDate = new Date(body.joinDate + 'T00:00:00Z');
        }

        const employee = await Employee.create(body);

        return NextResponse.json(
            {
                success: true,
                data: employee
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create employee'
            },
            { status: 500 }
        );
    }
}
