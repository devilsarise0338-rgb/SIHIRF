import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate, useLocation } from 'react-router-dom';

export function Login() {
  const { signInWithOtp, verifyOtp } = useAuth();
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
      </div>
    </div>
  );
}
