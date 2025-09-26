"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Settings, 
  LogOut,
  Shield,
  Menu,
  X
} from 'lucide-react'
import { AuthErrorBoundary, AdminErrorBoundary } from '@/components/error-boundary'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, isAdmin, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [isAuthenticated, isLoading, isAdmin])

  const checkAdminAccess = async () => {
    if (isLoading) {
      return // Wait for auth to initialize
    }
    
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin')
      return
    }

    if (!isAdmin()) {
      router.push('/dashboard') // Redirect non-admin users
      return
    }
  }

  const handleLogout = () => {
    logout()
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: TrendingUp
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users
    },
    {
      name: 'Content Management',
      href: '/admin/scenarios',
      icon: BookOpen
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: TrendingUp
    },
    {
      name: 'System Settings',
      href: '/admin/settings',
      icon: Settings
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin()) {
    return null // Will redirect via useEffect
  }

  return (
    <AuthErrorBoundary
      onAuthError={() => {
        console.error('Admin authentication error - redirecting to login')
        router.push('/auth/login?redirect=/admin')
      }}
    >
      <AdminErrorBoundary 
        section="Layout"
        onAdminError={(error) => {
          console.error('Admin layout error:', error)
        }}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
              
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Shield className="h-8 w-8 text-teal-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-4 h-6 w-6" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Shield className="h-8 w-8 text-teal-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </div>
            
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-gray-200">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <AdminErrorBoundary section="Content">
                {children}
              </AdminErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
      </AdminErrorBoundary>
    </AuthErrorBoundary>
  )
}