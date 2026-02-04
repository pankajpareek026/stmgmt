import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';

/**
 * GET /api/auth/settings
 * Get user settings/preferences
 */
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

        const token = authHeader.substring(7);

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
                    currency: user.currency || 'INR',
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
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

        // Connect to DB
        await connectDB();

        // Get request body
        const body = await request.json();
        const { currency } = body;

        // Validate currency
        const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
        if (currency && !validCurrencies.includes(currency)) {
            return NextResponse.json(
                { success: false, error: 'Invalid currency code' },
                { status: 400 }
            );
        }

        // Update user settings
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Update currency if provided
        if (currency) {
            user.currency = currency;
            await user.save();
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    currency: user.currency,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating user settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
