"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AuthCard from "@/components/auth/auth-card"
import FormField from "@/components/auth/form-field"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login, error: authError, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [generalError, setGeneralError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError("")

    if (!validateForm()) {
      return
    }

    try {
      const success = await login(formData.email, formData.password)
      
      if (success) {
        router.push('/dashboard')
      } else {
        setGeneralError(authError || "Invalid email or password. Please try again.")
      }
    } catch (error) {
      console.error('Login failed:', error)
      setGeneralError("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to your OET Praxis account to continue your healthcare professional training"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <Alert variant="destructive">
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        <FormField
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          required
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          required
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
        />

        <div className="flex items-center justify-between">
          <Link 
            href="/auth/forgot-password"
            className="text-sm hover:underline"
            style={{ color: '#008080' }}
          >
            Forgot your password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: '#008080' }}
          disabled={authLoading}
        >
          {authLoading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="text-center">
          <p className="text-sm" style={{ color: '#36454F' }}>
            Don't have an account?{" "}
            <Link 
              href="/auth/register"
              className="font-medium hover:underline"
              style={{ color: '#008080' }}
            >
              Create your free account
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  )
}