import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { generateTemporaryBearerToken } from '../api/auth'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('analyst@security.io')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please fill in both email and password.')
      return
    }

    if (email !== 'analyst@security.io' || password !== 'password123') {
      setError('Invalid email or password. Please use the demo credentials.')
      return
    }

    const token = generateTemporaryBearerToken(email)
    login(email, token)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-6 sm:p-10">
      {/* Centered Brand Header Above Container */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex items-center gap-3 mb-2">
          <img
            src="/logo.png"
            alt="Web Security Scanner Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded shrink-0"
          />
          <span className="text-title sm:text-h1 text-heading">
            Web Security Scanner
          </span>
        </div>
        <p className="text-sm text-body">
          Automated Vulnerability Assessment & DAST Console
        </p>
      </div>

      {/* Card Container with Profile-Controlled Background and Border */}
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-2xl">
        {/* Main Header (H1) & Sub-description */}
        <div className="mb-8">
          <h1 className="text-h1 text-heading">
            Sign in
          </h1>
          <p className="text-base text-desc mt-2">
            Enter your credentials to access the console.
          </p>
        </div>

        {/* Bare text in status red only if error occurs (no card / box) */}
        {error && (
          <p className="text-sm font-semibold text-status-red mb-6">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field via unified Input component */}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(null)
            }}
            placeholder="analyst@security.io"
            required
          />

          {/* Password Field via unified Input component */}
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError(null)
            }}
            placeholder="••••••••••••"
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-desc hover:text-heading transition p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="size-icon-md shrink-0" />
                ) : (
                  <Eye className="size-icon-md shrink-0" />
                )}
              </button>
            }
          />

          {/* Inline Helper Note with Auto-Fill Trigger using Sub Button component */}
          <div className="flex items-center justify-between text-sm text-body pt-1">
            <div className="flex items-center gap-2">
              <Lock className="size-icon-sm text-desc shrink-0" />
              <span className="text-xs sm:text-sm text-caption sm:text-body">Default demo: analyst@security.io / password123</span>
            </div>
            
          </div>

          {/* Submit Action Button: Main Button (Primary) with clean bg shift (no glow), text remains black */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-3"
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}