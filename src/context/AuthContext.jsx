import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failedAttempts, setFailedAttempts] = useState(0)

  // Track failed login attempts in localStorage
  const getFailedAttempts = () => {
    const attempts = localStorage.getItem('login_failed_attempts')
    const timestamp = localStorage.getItem('login_failed_timestamp')
    
    // Reset if more than 15 minutes have passed
    if (timestamp && Date.now() - parseInt(timestamp) > 15 * 60 * 1000) {
      localStorage.removeItem('login_failed_attempts')
      localStorage.removeItem('login_failed_timestamp')
      return 0
    }
    
    return attempts ? parseInt(attempts) : 0
  }

  const incrementFailedAttempts = () => {
    const attempts = getFailedAttempts() + 1
    localStorage.setItem('login_failed_attempts', attempts.toString())
    localStorage.setItem('login_failed_timestamp', Date.now().toString())
    setFailedAttempts(attempts)
    return attempts
  }

  const resetFailedAttempts = () => {
    localStorage.removeItem('login_failed_attempts')
    localStorage.removeItem('login_failed_timestamp')
    setFailedAttempts(0)
  }

  // Check session on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session) {
        resetFailedAttempts()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) {
        resetFailedAttempts()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auto-refresh session
  useEffect(() => {
    if (session) {
      const refreshInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('Session refresh error:', error)
            // If refresh fails, logout
            await signOut()
          } else if (data.session) {
            setSession(data.session)
          }
        } catch (error) {
          console.error('Session refresh failed:', error)
          await signOut()
        }
      }, 60 * 60 * 1000) // Refresh every hour

      return () => clearInterval(refreshInterval)
    }
  }, [session])

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const attempts = incrementFailedAttempts()
        
        // Provide more helpful error messages
        let errorMessage = error.message || 'Invalid email or password'
        
        if (error.status === 400) {
          // Check if it's a user not found or wrong password
          if (error.message?.includes('Invalid login credentials') || 
              error.message?.includes('Email not confirmed') ||
              error.message?.toLowerCase().includes('user')) {
            errorMessage = 'Invalid email or password. If you don\'t have an account, please sign up first.'
          } else {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.'
          }
        } else if (error.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials.'
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before signing in. Check your inbox for a confirmation link.'
        }
        
        throw { 
          ...error, 
          failedAttempts: attempts,
          message: errorMessage,
          userMessage: errorMessage
        }
      }

      resetFailedAttempts()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
      resetFailedAttempts()
      // Navigation handled by ProtectedRoute component
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const signUp = async (email, password, options = {}) => {
    try {
      console.log('Attempting signup with:', {
        email,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      })

      // Try signup with minimal options first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/',
          // Don't include skip_email_confirm - it's not a valid option
        }
      })
      
      console.log('Signup response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name
        } : null
      })
      
      // Handle specific error cases
      if (error) {
        // Log full error for debugging
        console.error('Signup error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          fullError: error
        })
        
        // Provide more helpful error messages based on actual error
        let errorMessage = error.message
        let showWorkaround = false
        
        if (error.status === 500) {
          // Check the actual error message for more specific guidance
          const actualError = error.message?.toLowerCase() || ''
          
          if (actualError.includes('database error') || actualError.includes('saving new user')) {
            errorMessage = `Database error (500): ${error.message}. This usually means: 1) Site URL mismatch (check if Supabase Site URL matches ${window.location.origin}), 2) Billing restrictions, or 3) Database-level issue. Check Supabase Dashboard → Authentication → URL Configuration and ensure Site URL is set to: ${window.location.origin}`
            showWorkaround = true
          } else if (actualError.includes('site url') || actualError.includes('redirect')) {
            errorMessage = `Site URL configuration error (500). Please set Site URL in Supabase Dashboard → Authentication → URL Configuration to: ${window.location.origin}`
            showWorkaround = true
          } else if (actualError.includes('email') && actualError.includes('service')) {
            errorMessage = 'Email service configuration error (500). Please disable email confirmation in Supabase Dashboard → Authentication → Settings, or configure SMTP.'
            showWorkaround = true
          } else {
            errorMessage = `Server error (500): ${error.message}. Common causes: 1) Site URL not set or mismatched (should be ${window.location.origin}), 2) Email confirmation enabled without SMTP, 3) Billing restrictions. Check Supabase Dashboard → Authentication → URL Configuration.`
            showWorkaround = true
          }
        } else if (error.status === 400) {
          if (error.message?.includes('email') || error.message?.includes('already')) {
            errorMessage = 'Email address is invalid or already in use.'
          } else if (error.message?.includes('password')) {
            errorMessage = 'Password does not meet requirements (minimum 6 characters).'
          }
        } else if (error.message?.includes('email')) {
          errorMessage = 'Email address is invalid or already in use.'
        } else if (error.message?.includes('password')) {
          errorMessage = 'Password does not meet requirements (minimum 6 characters).'
        }
        
        return { 
          data: null, 
          error: {
            ...error,
            message: errorMessage,
            userMessage: errorMessage,
            showWorkaround
          }
        }
      }
      
      // Success - user created
      if (data?.user) {
        console.log('User created successfully:', data.user.id)
        return { data, error: null }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Signup exception:', error)
      return { 
        data: null, 
        error: {
          message: error.message || 'Failed to create account. Please check your Supabase configuration.',
          userMessage: 'Failed to create account. Please try again or use the Management API workaround.',
          showWorkaround: true
        }
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUp,
    failedAttempts: getFailedAttempts(),
    resetFailedAttempts,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

