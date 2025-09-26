import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, AuthState } from '@/types/auth'

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,

        // Actions
        setUser: (user) => set(
          { 
            user, 
            isAuthenticated: !!user 
          },
          false,
          'auth/setUser'
        ),

        setLoading: (isLoading) => set(
          { isLoading },
          false,
          'auth/setLoading'
        ),

        login: (user) => set(
          { 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          },
          false,
          'auth/login'
        ),

        logout: () => set(
          { 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          },
          false,
          'auth/logout'
        ),

        updateUser: (updates) => {
          const currentUser = get().user
          if (currentUser) {
            set(
              { 
                user: { ...currentUser, ...updates } 
              },
              false,
              'auth/updateUser'
            )
          }
        },
      }),
      {
        name: 'oet-auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
)