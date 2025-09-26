import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OET Praxis - AI-Powered Speaking Practice for Healthcare Professionals',
  description: 'Master your OET speaking skills with AI-powered practice sessions designed specifically for doctors, nurses, dentists, and physiotherapists.',
  keywords: ['OET', 'speaking practice', 'healthcare', 'medical English', 'AI tutoring'],
  authors: [{ name: 'OET Praxis Team' }],
  openGraph: {
    title: 'OET Praxis - AI-Powered Speaking Practice',
    description: 'Master your OET speaking skills with AI-powered practice sessions',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'OET Praxis',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OET Praxis - AI-Powered Speaking Practice',
    description: 'Master your OET speaking skills with AI-powered practice sessions',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}