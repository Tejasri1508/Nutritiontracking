import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, Eye, EyeOff, ArrowLeft, X, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';

export function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      showToast('Welcome back!', 'success');
      navigate('/dashboard');
    }
  }

  function openResetModal() {
    setResetEmail(email);
    setResetSent(false);
    setShowResetModal(true);
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetEmail) {
      showToast('Please enter your email', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    setResetSending(true);
    const { error: resetError } = await resetPassword(resetEmail);
    if (resetError) {
      showToast(resetError, 'error');
    } else {
      setResetSent(true);
      showToast('Password reset email sent!', 'success');
    }
    setResetSending(false);
  }

  function closeResetModal() {
    setShowResetModal(false);
    setResetSent(false);
    setResetEmail('');
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-neutral-950">
      {/* Left side */}
      <div className="lg:w-1/2 bg-gradient-to-br from-green-600 to-lime-600 text-white p-8 lg:p-12 flex flex-col justify-between min-h-[300px] lg:min-h-screen relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />

        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold">Nutrition Tracker</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">Welcome Back!</h1>
          <p className="text-green-50 text-lg">
            Continue your journey to better health. Track your nutrition, stay hydrated, and achieve your wellness goals.
          </p>
          <div className="mt-8 space-y-2.5">
            {['AI Food Recognition', 'Calorie & Macro Tracking', 'Sleep, Steps & Water Monitoring', 'Workout Tracking with Form Check'].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-3 h-3 text-white" />
                </div>
                <span className="text-green-50">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-green-100 text-sm relative z-10">Your wellness companion, every step of the way.</p>
      </div>

      {/* Right side - form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">Login</h2>
          <p className="text-sm text-neutral-500 mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-neutral-600 dark:text-neutral-400">Remember me</span>
              </label>
              <button type="button" onClick={openResetModal} className="text-green-600 hover:underline">Forgot password?</button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal open={showResetModal} onClose={closeResetModal} title="Reset Password">
        {resetSent ? (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Check Your Email</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                We've sent a password reset link to <span className="font-medium text-neutral-700 dark:text-neutral-300">{resetEmail}</span>. Click the link in the email to set a new password.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-left">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                If you don't see the email within a few minutes, check your spam folder. The link will expire after a limited time.
              </p>
            </div>
            <button onClick={closeResetModal} className="btn-secondary w-full">Close</button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" disabled={resetSending} className="btn-primary w-full flex items-center justify-center gap-2">
              {resetSending ? (
                <>Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Reset Link</>
              )}
            </button>
            <button type="button" onClick={closeResetModal} className="btn-secondary w-full">Cancel</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
