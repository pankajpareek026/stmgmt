import { connectDB } from '@/lib/db/connect';
import Project from '@/lib/models/Project';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const projects = await Project.find();

        return NextResponse.json({
            success: true,
            count: projects.length,
            data: projects
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
