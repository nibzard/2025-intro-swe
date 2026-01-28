import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UserPlus, Eye, EyeOff, AlertCircle, ArrowLeft, Check } from 'lucide-react';

interface RegisterPageProps {
  theme: string;
}

export default function RegisterPage({ theme }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    match: password === confirmPassword && password.length > 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate fields
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm';

  const inputClass = theme === 'dark'
    ? 'input-field'
    : 'input-field bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500';

  const textClass = theme === 'dark' ? 'text-navy-100' : 'text-gray-900';
  const mutedTextClass = theme === 'dark' ? 'text-navy-400' : 'text-gray-500';
  const bgClass = theme === 'dark' ? 'bg-navy-950' : 'bg-gray-50';

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center px-4 py-12`}>
      <div className={`w-full max-w-md ${glassCardClass} p-8 rounded-2xl`}>
        {/* Back button */}
        <Link
          to="/"
          className={`inline-flex items-center gap-2 ${mutedTextClass} hover:text-primary-500 transition-colors mb-6`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 mb-4">
            <UserPlus className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className={`text-2xl font-bold ${textClass} mb-2`}>Create an account</h1>
          <p className={mutedTextClass}>Get started with LLM Answer Watcher</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Register form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className={`block text-sm font-medium ${textClass} mb-2`}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className={inputClass}
              disabled={isLoading}
              autoComplete="username"
            />
            <p className={`mt-1 text-xs ${mutedTextClass}`}>
              At least 3 characters, letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${textClass} mb-2`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={inputClass}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${textClass} mb-2`}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className={`${inputClass} pr-12`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedTextClass} hover:text-primary-500 transition-colors`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Password requirements */}
            <div className="mt-2 space-y-1">
              <div className={`flex items-center gap-2 text-xs ${passwordChecks.length ? 'text-green-500' : mutedTextClass}`}>
                <Check className={`w-3 h-3 ${passwordChecks.length ? 'opacity-100' : 'opacity-50'}`} />
                At least 8 characters
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={`block text-sm font-medium ${textClass} mb-2`}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={inputClass}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {confirmPassword && (
              <div className={`mt-2 flex items-center gap-2 text-xs ${passwordChecks.match ? 'text-green-500' : 'text-red-400'}`}>
                <Check className={`w-3 h-3 ${passwordChecks.match ? 'opacity-100' : 'opacity-50'}`} />
                {passwordChecks.match ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwordChecks.length || (confirmPassword && !passwordChecks.match)}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create account
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className={`mt-6 text-center ${mutedTextClass}`}>
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
