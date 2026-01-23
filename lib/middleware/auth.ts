import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends NextRequest {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

export function withAuth(handler: (req: AuthRequest) => Promise<NextResponse>) {
    return async (request: AuthRequest) => {
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

            // Attach user info to request
            (request as any).user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };

            // Call the handler
            return handler(request);
        } catch (error) {
            console.error('Auth error:', error);
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Invalid token' },
                { status: 401 }
            );
        }
    };
}

export function withRole(role: string | string[]) {
    return (handler: (req: AuthRequest) => Promise<NextResponse>) => {
        return async (request: AuthRequest) => {
            return withAuth(async (req: AuthRequest) => {
                const allowedRoles = Array.isArray(role) ? role : [role];

                if (!req.user || !allowedRoles.includes(req.user.role)) {
                    return NextResponse.json(
                        { success: false, error: 'Forbidden - Insufficient permissions' },
                        { status: 403 }
                    );
                }

                return handler(req);
            })(request);
        };
    };
}
