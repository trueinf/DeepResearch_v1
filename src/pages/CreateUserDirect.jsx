import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

// This is a temporary workaround page to create users directly via Management API
// Use this if regular signup fails with 500 error
export default function CreateUserDirect() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email || !password) {
      setError('Please fill in email and password')
      return
    }

    setIsLoading(true)

    try {
      console.log('Creating user via Edge Function:', {
        email,
        url: `${SUPABASE_URL}/functions/v1/create-user`
      })

      // Use Edge Function (preferred - no service role key needed)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      })

      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Response data:', data)

      if (!response.ok) {
        let errorMessage = data.error || data.message || 'Failed to create user'
        
        if (response.status === 400) {
          if (data.error?.includes('already') || data.error?.includes('registered')) {
            errorMessage = 'Email address is already registered. Please use a different email or sign in instead.'
          } else if (data.error?.includes('password')) {
            errorMessage = 'Password does not meet requirements (minimum 6 characters).'
          } else if (data.error?.includes('email')) {
            errorMessage = 'Invalid email format.'
          }
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again or use the manual method below.'
        }
        
        throw new Error(errorMessage)
      }

      if (data.success && data.user) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/', {
            state: { message: `User ${email} created successfully!` }
          })
        }, 2000)
      } else {
        throw new Error('User creation failed - unexpected response')
      }
    } catch (err) {
      console.error('Create user error:', err)
      setError(err.message || 'Failed to create user. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Create User (Direct)
            </h1>
            <p className="text-sm text-gray-600">Workaround for 500 signup errors - No API key needed!</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">User created successfully! Redirecting to login...</p>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-semibold mb-1">✅ Using Secure Edge Function</p>
              <p className="text-xs text-green-700">No API key needed! User creation is handled securely server-side.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating user...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create User
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Back to regular signup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

