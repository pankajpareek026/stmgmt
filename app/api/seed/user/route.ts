import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        await connectDB();

        // Check if demo user exists
        const existingUser = await User.findOne({ email: 'admin@test.com' });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: true,
                    message: 'Demo user already exists',
                    email: 'admin@test.com',
                    password: 'password123',
                },
                { status: 200 }
            );
        }

        // Create demo user
        const demoUser = await User.create({
            email: 'admin@test.com',
            password: 'password123',
            name: 'Admin User',
            role: 'admin',
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Demo user created successfully',
                email: demoUser.email,
                password: 'password123',
                role: demoUser.role,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error seeding user:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to seed user',
            },
            { status: 500 }
        );
    }
}
