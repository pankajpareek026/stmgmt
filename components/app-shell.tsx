'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/api-service';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { CurrencyProvider } from '@/components/currency-provider';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

        if (isPublicRoute) {
            setIsLoading(false);
            return;
        }

        // Check if user has auth token
        const token = getAuthToken();

        if (!token) {
            // No token, redirect to login
            router.push('/login');
            return;
        }

        // Token exists, allow access
        setIsAuthenticated(true);
        setIsLoading(false);
    }, [pathname, router]);

    // Show loader only if we are determining auth status for a protected route
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // If public route, just render content without shell
    if (PUBLIC_ROUTES.includes(pathname)) {
        return <>{children}</>;
    }

    // If not authenticated and not public (should have redirected), render nothing
    if (!isAuthenticated) {
        return null;
    }

    // Authenticated Layout
    return (
        <CurrencyProvider>
            <div className="min-h-screen bg-background">
                <DesktopSidebar />
                <MobileNav />

                {/* Main content area with padding for navigation */}
                <main className="lg:pl-64 pt-16 pb-20 lg:pt-0 lg:pb-0">
                    <div className="container mx-auto p-4 lg:p-6">{children}</div>
                </main>
            </div>
        </CurrencyProvider>
    );
}
