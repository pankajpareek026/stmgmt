import { connectDB } from '@/lib/db/connect';
import Expense from '@/lib/models/Expense';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const expense = await Expense.findById(params.id).populate('projectId', 'name');

        if (!expense) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Expense not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: expense
        });
    } catch (error) {
        console.error('Error fetching expense:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch expense'
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

        let expense = await Expense.findById(params.id);

        if (!expense) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Expense not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        expense = await Expense.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true
        });

        return NextResponse.json({
            success: true,
            data: expense
        });
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update expense'
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

        const expense = await Expense.findById(params.id);

        if (!expense) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Expense not found with id of ${params.id}`
                },
                { status: 404 }
            );
        }

        await Expense.findByIdAndDelete(params.id);

        return NextResponse.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete expense'
            },
            { status: 500 }
        );
    }
}
