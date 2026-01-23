import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Create a response that clears the auth token
        const response = NextResponse.json(
            {
                success: true,
                message: 'Logged out successfully',
            },
            { status: 200 }
        );

        // Clear the token cookie if using cookies
        response.cookies.set({
            name: 'auth_token',
            value: '',
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error('Error logging out:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to log out',
            },
            { status: 500 }
        );
    }
}
