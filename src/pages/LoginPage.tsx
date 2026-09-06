import React, { useState } from 'react'
import { useAuth } from '@/src/hooks/useAuth'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signInWithOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.endsWith('@piet.ac.in')) {
      setError('Only @piet.ac.in emails are allowed.')
      return
    }
    setLoading(true)
    try {
      await signInWithOtp(email)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOtp(email, otp)
      navigate('/register')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-neutral/20 p-8 rounded-xl shadow-sm">
        <h2 className="font-display text-2xl font-bold mb-2">Sign in</h2>
        <p className="text-sm text-neutral mb-6">Use your college email to continue.</p>

        {error && <div className="mb-4 p-3 bg-ember/10 text-ember text-sm rounded-md">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@piet.ac.in"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">6-digit Code</label>
              <Input
                type="text"
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                className="font-mono text-center tracking-widest text-lg"
                maxLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-neutral hover:text-ink mt-2"
            >
              Back to email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
