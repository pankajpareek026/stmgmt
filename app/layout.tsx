import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { MobileNav } from "@/components/mobile-nav"
import { DesktopSidebar } from "@/components/desktop-sidebar"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ConstructWork - Workforce Management",
  description:
    "Professional construction workforce management system for tracking projects, employees, attendance, payroll, and expenses",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <div className="min-h-screen bg-background">
          <DesktopSidebar />
          <MobileNav />

          {/* Main content area with padding for navigation */}
          <main className="lg:pl-64 pt-16 pb-20 lg:pt-0 lg:pb-0">
            <div className="container mx-auto p-4 lg:p-6">{children}</div>
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
