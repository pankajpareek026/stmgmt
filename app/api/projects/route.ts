import { connectDB } from '@/lib/db/connect';
import Project from '@/lib/models/Project';
import Payroll from '@/lib/models/Payroll';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const projects = await Project.find();

        // Calculate total spend for each project from employee payments
        const projectsWithSpend = await Promise.all(
            projects.map(async (project) => {
                const projectObj = project.toObject();

                // Get all payroll records and sum payments for this project
                const payrolls = await Payroll.find({
                    'payments.projectId': project._id
                });

                // Sum up all payments that match this projectId
                const totalSpend = payrolls.reduce((projectTotal, payroll) => {
                    const projectPayments = payroll.payments.filter(
                        (payment: any) => payment.projectId && payment.projectId.toString() === project._id.toString()
                    );
                    const payrollProjectTotal = projectPayments.reduce(
                        (sum: number, payment: any) => sum + (payment.amount || 0),
                        0
                    );
                    return projectTotal + payrollProjectTotal;
                }, 0);

                return {
                    ...projectObj,
                    spent: totalSpend,
                    totalSpend: totalSpend
                };
            })
        );

        return NextResponse.json({
            success: true,
            count: projectsWithSpend.length,
            data: projectsWithSpend
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch projects'
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
        if (!body.name || !body.location || !body.startDate || !body.budget || !body.manager) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: name, location, startDate, budget, manager'
                },
                { status: 400 }
            );
        }

        const project = await Project.create(body);

        return NextResponse.json(
            {
                success: true,
                data: project
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create project'
            },
            { status: 500 }
        );
    }
}
