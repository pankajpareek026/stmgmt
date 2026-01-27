'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { apiService } from '@/lib/api-service'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        try {
            // Simulated API call
            const response = await apiService.post('/auth/forgot-password', { email })

            if (response.success) {
                setSuccess(true)
            } else {
                setError(response.error || 'Failed to send reset link')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mb-4">
                        <div className="inline-block w-16 h-16 relative overflow-hidden rounded-lg mx-auto">
                            <img src="/logo.png" alt="ConstPro Logo" className="object-cover w-full h-full" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive a password reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4 text-center">
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    If an account exists for {email}, a reset link has been sent.
                                </AlertDescription>
                            </Alert>
                            <p className="text-sm text-muted-foreground">
                                Please check your email for the link. In this demo, the link will be logged in the console.
                            </p>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center text-sm text-primary hover:underline font-medium"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
