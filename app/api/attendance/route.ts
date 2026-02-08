import { connectDB } from '@/lib/db/connect';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee'; // Registering for populate
import Project from '@/lib/models/Project';   // Registering for populate
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const attendances = await Attendance.find()
            .populate('employeeId', 'name role')
            .populate('projectId', 'name');

        // Ensure each record has an id field for client-side operations
        const transformedAttendances = attendances.map((att: any) => {
            const doc = att.toObject ? att.toObject() : att;
            return {
                ...doc,
                id: doc.id || doc._id?.toString() || doc._id
            };
        });

        return NextResponse.json({
            success: true,
            count: transformedAttendances.length,
            data: transformedAttendances
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

        // Validate that each record has an employeeId and projectId
        for (const record of records) {
            if (!record.employeeId || !record.projectId) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Missing required fields: employeeId or projectId in one of the records'
                    },
                    { status: 400 }
                );
            }
        }

        // Create bulk operations
        const operations = records.map((record: any) => {
            // Normalize the date to ensure consistency
            // If date is a string like "2026-02-05", convert to Date at midnight UTC
            let normalizedDate;
            if (typeof record.date === 'string') {
                // Parse as UTC midnight to avoid timezone issues
                normalizedDate = new Date(record.date + 'T00:00:00.000Z');
            } else if (record.date instanceof Date) {
                normalizedDate = record.date;
            } else {
                normalizedDate = new Date(record.date);
            }

            // Create the record with normalized date
            const normalizedRecord = {
                ...record,
                date: normalizedDate
            };

            return {
                updateOne: {
                    filter: {
                        employeeId: record.employeeId,
                        // Use date range filter to match the same day regardless of exact timestamp
                        date: {
                            $gte: new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate()),
                            $lt: new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate() + 1)
                        }
                    },
                    update: { $set: normalizedRecord },
                    upsert: true
                }
            };
        });

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
