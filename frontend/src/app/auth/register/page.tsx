"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AuthCard from "@/components/auth/auth-card"
import FormField from "@/components/auth/form-field"
import SelectField from "@/components/auth/select-field"
import Link from "next/link"
import { apiRequest, setAuthToken } from "@/lib/api-utils"
import { config } from "@/config/app"

const HEALTHCARE_PROFESSIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "dentist", label: "Dentist" },
  { value: "physiotherapist", label: "Physiotherapist" }
]

const EXPERIENCE_LEVELS = [
  { value: "student", label: "Student" },
  { value: "graduate", label: "Recent Graduate (0-2 years)" },
  { value: "experienced", label: "Experienced (3-10 years)" },
  { value: "senior", label: "Senior Professional (10+ years)" }
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    profession: "",
    experienceLevel: ""
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)

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

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user makes selection
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters"
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation (as per user-journeys.md: 8+ characters, 1 uppercase, 1 number)
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long"
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter"
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number"
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Profession validation
    if (!formData.profession) {
      newErrors.profession = "Healthcare profession is required"
    }

    // Experience level validation
    if (!formData.experienceLevel) {
      newErrors.experienceLevel = "Experience level is required"
    }

    // Terms acceptance validation
    if (!acceptedTerms) {
      newErrors.terms = "You must accept the Terms of Service to continue"
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

    setIsLoading(true)

    try {
            // Call the real registration API with fullName as expected by backend
      const data = await apiRequest<{
        accessToken: string
        refreshToken: string
        user: any
      }>('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          profession: formData.profession
        })
      }, false)
      
      // Store authentication token and user data
      if (data.accessToken) {
        setAuthToken(data.accessToken)
        localStorage.setItem(config.auth.refreshTokenKey, data.refreshToken)
        localStorage.setItem(config.auth.userKey, JSON.stringify(data.user))
      }
      
      // Redirect to dashboard on successful registration
      router.push('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      setGeneralError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create Your Account"
      description="Join thousands of healthcare professionals advancing their careers with OET Praxis"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <Alert variant="destructive">
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        <FormField
          id="fullName"
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          required
          value={formData.fullName}
          onChange={handleInputChange}
          error={errors.fullName}
        />

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            id="profession"
            label="Healthcare Profession"
            placeholder="Select your profession"
            required
            value={formData.profession}
            onValueChange={handleSelectChange("profession")}
            options={HEALTHCARE_PROFESSIONS}
            error={errors.profession}
          />

          <SelectField
            id="experienceLevel"
            label="Experience Level"
            placeholder="Select your experience"
            required
            value={formData.experienceLevel}
            onValueChange={handleSelectChange("experienceLevel")}
            options={EXPERIENCE_LEVELS}
            error={errors.experienceLevel}
          />
        </div>

        <FormField
          id="password"
          label="Password"
          type="password"
          placeholder="Create a strong password"
          required
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
        />

        <FormField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          required
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
        />

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm" style={{ color: '#36454F' }}>
            I agree to the{" "}
            <Link href="/terms" className="hover:underline" style={{ color: '#008080' }}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:underline" style={{ color: '#008080' }}>
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.terms && (
          <p className="text-sm" style={{ color: '#FF0000' }}>
            {errors.terms}
          </p>
        )}

        <Button
          type="submit"
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: '#008080' }}
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>

        <div className="text-center">
          <p className="text-sm" style={{ color: '#36454F' }}>
            Already have an account?{" "}
            <Link 
              href="/auth/login"
              className="font-medium hover:underline"
              style={{ color: '#008080' }}
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  )
}