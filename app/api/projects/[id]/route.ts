import { connectDB } from '@/lib/db/connect';
import Project from '@/lib/models/Project';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const project = await Project.findById(id).populate('employeeIds');

        if (!project) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Project not found with id of ${id}`
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch project'
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

        let project = await Project.findById(id);

        if (!project) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Project not found with id of ${id}`
                },
                { status: 404 }
            );
        }

        project = await Project.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true
        }).populate('employeeIds');

        return NextResponse.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update project'
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

        const project = await Project.findById(id);

        if (!project) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Project not found with id of ${id}`
                },
                { status: 404 }
            );
        }

        await Project.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete project'
            },
            { status: 500 }
        );
    }
}
