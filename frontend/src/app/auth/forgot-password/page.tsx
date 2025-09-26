"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AuthCard from "@/components/auth/auth-card"
import FormField from "@/components/auth/form-field"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    // Clear error when user starts typing
    if (error) {
      setError("")
    }
  }

  const validateEmail = () => {
    if (!email) {
      setError("Email address is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail()) {
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implement actual password reset API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setIsSubmitted(true)
    } catch (error) {
      setError("Unable to send reset email. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <AuthCard
        title="Check Your Email"
        description="We've sent password reset instructions to your email address"
      >
        <div className="text-center space-y-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#E0F2F1' }}
          >
            <span style={{ color: '#008080' }} className="text-2xl">✉️</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#36454F' }}>
              We've sent password reset instructions to:
            </p>
            <p className="font-medium" style={{ color: '#008080' }}>
              {email}
            </p>
          </div>

          <Alert>
            <AlertDescription>
              If you don't see the email in your inbox, please check your spam folder. 
              The reset link will expire in 24 hours for security.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full"
              style={{ borderColor: '#008080', color: '#008080' }}
            >
              Send Another Email
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/login"
                className="text-sm hover:underline"
                style={{ color: '#008080' }}
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Reset Your Password"
      description="Enter your email address and we'll send you instructions to reset your password"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          required
          value={email}
          onChange={handleInputChange}
          error=""
        />

        <div className="space-y-4">
          <Button
            type="submit"
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: '#008080' }}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Instructions"}
          </Button>

          <div className="text-center space-y-2">
            <Link 
              href="/auth/login"
              className="text-sm hover:underline block"
              style={{ color: '#008080' }}
            >
              Back to Sign In
            </Link>
            
            <p className="text-sm" style={{ color: '#36454F' }}>
              Don't have an account?{" "}
              <Link 
                href="/auth/register"
                className="font-medium hover:underline"
                style={{ color: '#008080' }}
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </form>
    </AuthCard>
  )
}