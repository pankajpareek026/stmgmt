import { connectDB } from '@/lib/db/connect';
import Employee from '@/lib/models/Employee';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
    try {
        await connectDB();

        const employees = await Employee.find({});
        let cleanedCount = 0;
        let modifiedEmployees = 0;

        for (const employee of employees) {
            const originalProjectIds = employee.projectIds || [];
            const validProjectIds = originalProjectIds.filter((id: any) => {
                // If it's already an ObjectId, keep it
                if (id instanceof mongoose.Types.ObjectId) return true;

                // If it's a string, check if it's a valid hex string of 24 chars
                if (typeof id === 'string') {
                    // Check if it's the specific malformed string we saw
                    if (id.includes('\n') || id.includes('{ name:')) {
                        return false;
                    }
                    return mongoose.Types.ObjectId.isValid(id);
                }

                // If it's an object with id (like the one in the error message)
                if (id && typeof id === 'object' && (id.id || id._id)) {
                    return false; // We want only IDs in the array
                }

                return false;
            });

            if (validProjectIds.length !== originalProjectIds.length) {
                employee.projectIds = validProjectIds;
                await employee.save();
                cleanedCount += (originalProjectIds.length - validProjectIds.length);
                modifiedEmployees++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cleanup completed. Removed ${cleanedCount} malformed IDs from ${modifiedEmployees} employees.`,
            details: {
                totalEmployees: employees.length,
                modifiedEmployees,
                removedIds: cleanedCount
            }
        });
    } catch (error) {
        console.error('Cleanup Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Cleanup failed'
            },
            { status: 500 }
        );
    }
}
