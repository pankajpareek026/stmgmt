'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { apiService, setAuthToken } from '@/lib/api-service'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await apiService.post('/auth/login', {
                email,
                password,
            })

            if (response.success && response.token) {
                // Save token
                setAuthToken(response.token)

                // Redirect to dashboard
                router.push('/')
                router.refresh()
            } else {
                setError(response.error || 'Login failed')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mb-4">
                        <div className="inline-block bg-primary text-primary-foreground rounded-lg p-3 font-bold text-xl">
                            CW
                        </div>
                    </div>
                    <CardTitle className="text-2xl">ConstructWork</CardTitle>
                    <CardDescription>Workforce Management System</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>

                        <div className="text-center text-sm">
                            <p className="text-muted-foreground">
                                Don't have an account?{' '}
                                <a
                                    href="/signup"
                                    className="text-primary hover:underline font-medium"
                                >
                                    Sign up
                                </a>
                            </p>
                        </div>
                    </form>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground font-mono">
                            <strong>Demo:</strong>
                            <br />
                            Email: admin@test.com
                            <br />
                            Password: password123
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
