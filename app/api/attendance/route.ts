import { connectDB } from '@/lib/db/connect';
import Attendance from '@/lib/models/Attendance';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const attendances = await Attendance.find()
            .populate('employeeId', 'name role')
            .populate('projectId', 'name');

        return NextResponse.json({
            success: true,
            count: attendances.length,
            data: attendances
        });
    } catch (error) {
        console.error('Error fetching attendances:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch attendances'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        let records = [];

        // Normalize input to array
        if (Array.isArray(body.records)) {
            records = body.records;
        } else {
            // Validation for single record
            if (!body.employeeId || !body.projectId || !body.date || !body.checkIn) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Missing required fields: employeeId, projectId, date, checkIn'
                    },
                    { status: 400 }
                );
            }
            records = [body];
        }

        // Create bulk operations
        const operations = records.map((record: any) => ({
            updateOne: {
                filter: {
                    employeeId: record.employeeId,
                    date: record.date
                },
                update: { $set: record },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Attendance.bulkWrite(operations);
        }

        return NextResponse.json(
            {
                success: true,
                message: `Processed ${operations.length} records successfully`
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating attendance:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create attendance'
            },
            { status: 500 }
        );
    }
}
