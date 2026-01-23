import { connectDB } from '@/lib/db/connect';
import Expense from '@/lib/models/Expense';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const expenses = await Expense.find().populate('projectId', 'name');

        return NextResponse.json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch expenses'
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
        if (!body.category || !body.description || body.amount === undefined || !body.projectId || !body.submittedBy) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: category, description, amount, projectId, submittedBy'
                },
                { status: 400 }
            );
        }

        const expense = await Expense.create(body);

        return NextResponse.json(
            {
                success: true,
                data: expense
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create expense'
            },
            { status: 500 }
        );
    }
}
