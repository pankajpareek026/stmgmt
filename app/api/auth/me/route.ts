import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key'
        ) as any;

        // Connect to DB and fetch user
        await connectDB();
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    currency: user.currency || 'INR',
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching current user:', error);
        return NextResponse.json(
            { success: false, error: 'Unauthorized - Invalid token' },
            { status: 401 }
        );
    }
}
