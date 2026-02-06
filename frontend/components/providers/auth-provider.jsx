'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, setAuth, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await authAPI.getCurrentUser()
        const userData = response.data.data.user
        
        setAuth(
          userData,
          localStorage.getItem('accessToken'),
          localStorage.getItem('refreshToken')
        )
      } catch (error) {
        console.error('Auth check failed:', error)
        logout()
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [setAuth, logout])

  // Redirect logic - FIXED
  useEffect(() => {
    if (loading) return

    const publicPaths = ['/login', '/register', '/forgot-password']
    const isPublicPath = publicPaths.includes(pathname)

    // If NOT authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicPath) {
      router.push('/login')
      return
    }

    // If authenticated and on auth pages, redirect to dashboard
    if (isAuthenticated && isPublicPath) {
      router.push('/dashboard')
      return
    }
  }, [isAuthenticated, pathname, router, loading])

  // Show loading only on initial check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const value = {
    user,
    isAuthenticated,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}