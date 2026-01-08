import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2, Mail, Lock, AlertCircle, Shield } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaValue, setCaptchaValue] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  
  const { signIn, failedAttempts, resetFailedAttempts } = useAuth()
  const navigate = useNavigate()

  // Generate simple CAPTCHA
  useEffect(() => {
    if (failedAttempts >= 3) {
      setShowCaptcha(true)
      // Generate simple math CAPTCHA
      const num1 = Math.floor(Math.random() * 10) + 1
      const num2 = Math.floor(Math.random() * 10) + 1
      setCaptchaCode(`${num1 + num2}`)
    }
  }, [failedAttempts])

  // Client-side validation
  const validate = () => {
    const newErrors = {}

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    // CAPTCHA validation (if shown)
    if (showCaptcha) {
      if (!captchaValue.trim()) {
        newErrors.captcha = 'Please solve the CAPTCHA'
      } else if (captchaValue.trim() !== captchaCode) {
        newErrors.captcha = 'Incorrect CAPTCHA answer'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { data, error } = await signIn(email, password)

      if (error) {
        if (error.failedAttempts >= 3) {
          setShowCaptcha(true)
          // Regenerate CAPTCHA
          const num1 = Math.floor(Math.random() * 10) + 1
          const num2 = Math.floor(Math.random() * 10) + 1
          setCaptchaCode(`${num1 + num2}`)
        }
        
        setErrors({
          submit: error.message || 'Invalid email or password. Please try again.',
        })
        setIsLoading(false)
        return
      }

      // Success - redirect to dashboard
      if (data?.session) {
        navigate('/dashboard')
      }
    } catch (error) {
      setErrors({
        submit: error.message || 'An error occurred. Please try again.',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              AskDepth
            </h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{errors.submit}</p>
                {failedAttempts >= 3 && (
                  <p className="text-xs text-red-600 mt-1">
                    Multiple failed attempts detected. Please complete the CAPTCHA.
                  </p>
                )}
                {errors.submit?.includes("don't have an account") && (
                  <p className="text-xs text-red-600 mt-2">
                    <Link to="/signup" className="font-semibold underline hover:text-red-700">
                      Create an account here
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({ ...errors, email: '' })
                  }}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all ${
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: '' })
                  }}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all ${
                    errors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* CAPTCHA (if 3+ failed attempts) */}
            {showCaptcha && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm font-semibold text-yellow-800">
                    Security Verification Required
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white p-3 rounded-lg border-2 border-yellow-300">
                      <p className="text-lg font-bold text-gray-800 text-center">
                        {captchaCode.split('').map((char, i) => (
                          <span key={i} className="mx-1">
                            {char === '+' ? '+' : char}
                          </span>
                        ))}
                      </p>
                    </div>
                    <span className="text-gray-600">=</span>
                    <input
                      type="text"
                      value={captchaValue}
                      onChange={(e) => {
                        setCaptchaValue(e.target.value)
                        if (errors.captcha) setErrors({ ...errors, captcha: '' })
                      }}
                      className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 outline-none"
                      placeholder="?"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.captcha && (
                    <p className="text-sm text-red-600">{errors.captcha}</p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

