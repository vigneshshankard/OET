"use client"

import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  
  // For now, we'll consider user authenticated if they're not on auth pages or homepage
  // This will be replaced with actual auth logic later
  const isAuthenticated = !pathname.startsWith('/auth') && pathname !== '/'
  const isAuthPage = pathname.startsWith('/auth')
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.location.href = isAuthenticated ? '/dashboard' : '/'}
          >
            <div 
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: '#008080' }}
            >
              <span className="text-white font-bold text-sm">OP</span>
            </div>
            <span 
              className="text-xl font-bold"
              style={{ color: '#36454F' }}
            >
              OET Praxis
            </span>
          </div>
          
          {/* Only show navigation for authenticated users */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <a 
                href="/dashboard" 
                className="hover:opacity-80 transition-opacity"
                style={{ color: '#36454F' }}
              >
                Dashboard
              </a>
              <a 
                href="/scenarios" 
                className="hover:opacity-80 transition-opacity"
                style={{ color: '#36454F' }}
              >
                Scenarios
              </a>
              <a 
                href="/progress" 
                className="hover:opacity-80 transition-opacity"
                style={{ color: '#36454F' }}
              >
                Progress
              </a>
            </nav>
          )}
          
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              // Authenticated user actions
              <>
                <button 
                  className="px-4 py-2 rounded-md font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#008080' }}
                >
                  Start Practice
                </button>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: '#36454F' }}
                >
                  <span className="text-white text-sm">U</span>
                </div>
              </>
            ) : (
              // Unauthenticated user actions  
              <>
                <button 
                  onClick={() => window.location.href = '/auth/login'}
                  className="px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity border"
                  style={{ 
                    borderColor: '#008080', 
                    color: '#008080',
                    backgroundColor: 'transparent'
                  }}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => window.location.href = '/auth/register'}
                  className="px-4 py-2 rounded-md font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#008080' }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}