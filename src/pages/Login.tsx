import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate, useLocation } from 'react-router-dom';

export function Login() {
  const { signInWithOtp, verifyOtp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/register';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const { error } = await signInWithOtp(email);
    
    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const { error } = await verifyOtp(email, otp);
    
    if (error) {
      setError(error.message);
    } else {
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h1 className="text-3xl font-display mb-2">Sign in</h1>
          <p className="text-neutral-grey text-sm">
            Use your @piet.ac.in college email to access the SIH portal.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-ember/10 text-ember text-sm border border-ember/20">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="College Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@piet.ac.in"
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending link...' : 'Send Magic Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="6-Digit Code"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Sign In'}
            </Button>
            <button 
              type="button" 
              onClick={() => setStep('email')}
              className="text-sm text-neutral-grey hover:text-ink underline block text-center w-full mt-4"
            >
              Back to email
            </button>
          </form>
        )}

        <div className="relative flex items-center justify-center pt-4">
          <div className="absolute inset-x-0 top-1/2 mt-2 h-px bg-neutral-grey/20"></div>
          <span className="relative bg-paper px-4 text-xs font-medium uppercase tracking-wider text-neutral-grey mt-4">
            Or
          </span>
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          className="w-full flex items-center justify-center gap-2"
          onClick={async () => {
            setLoading(true);
            const { error } = await signInWithGoogle();
            if (error) setError(error.message);
            setLoading(false);
          }}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
