'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { apiService } from '@/lib/api-service'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token) {
            setError('Invalid or missing reset token')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Simulated API call
            const response = await apiService.post('/auth/reset-password', {
                token,
                password,
            })

            if (response.success) {
                setSuccess(true)
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            } else {
                setError(response.error || 'Failed to reset password')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!token && !success) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Invalid or expired reset link. Please request a new one.
                    <div className="mt-2">
                        <Link href="/forgot-password" title="Request new link" className="underline">
                            Request new link
                        </Link>
                    </div>
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Password reset successfully! Redirecting to login...
                    </AlertDescription>
                </Alert>
            )}

            {!success && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="pr-10"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                className="pr-10"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={loading}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting Password...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </Button>
                </>
            )}

            <div className="mt-6 text-center">
                <Link
                    href="/login"
                    className="text-sm text-primary hover:underline font-medium"
                >
                    Back to Login
                </Link>
            </div>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mb-4">
                        <div className="inline-block w-16 h-16 relative overflow-hidden rounded-lg mx-auto">
                            <img src="/logo.png" alt="ConstPro Logo" className="object-cover w-full h-full" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>
                        Set a new password for your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
