import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        // Simulate finding the user in the database
        // In a real app, you would check if the email exists

        // Simulate generating a token
        const token = Math.random().toString(36).substring(2, 15)
        const resetLink = `http://localhost:3000/reset-password?token=${token}`

        // Log the link (simulating sending an email)
        console.log('-------------------------------------------')
        console.log('PASSWORD RESET LINK SIMULATED EMAIL')
        console.log(`To: ${email}`)
        console.log(`Link: ${resetLink}`)
        console.log('-------------------------------------------')

        return NextResponse.json({
            success: true,
            message: 'Reset link sent if account exists',
        })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Something went wrong' },
            { status: 500 }
        )
    }
}
