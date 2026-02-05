import { connectDB } from '@/lib/db/connect';
import Attendance from '@/lib/models/Attendance';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const attendance = await Attendance.findById(params.id)
            .populate('employeeId', 'name role')
            .populate('projectId', 'name');

        if (!attendance) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Attendance record not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        // Ensure id field is set
        const doc = attendance.toObject ? attendance.toObject() : attendance;
        const transformedAttendance = {
            ...doc,
            id: doc.id || doc._id?.toString() || doc._id
        };

        return NextResponse.json({
            success: true,
            data: transformedAttendance
        });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch attendance'
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

        let attendance = await Attendance.findById(params.id);

        if (!attendance) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Attendance record not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        attendance = await Attendance.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true
        });

        return NextResponse.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        console.error('Error updating attendance:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update attendance'
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

        const attendance = await Attendance.findById(params.id);

        if (!attendance) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Attendance record not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        await Attendance.findByIdAndDelete(params.id);

        return NextResponse.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting attendance:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete attendance'
            },
            { status: 500 }
        );
    }
}
