import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LogIn, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  theme: string;
}

export default function LoginPage({ theme }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path or default to /app
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const glassCardClass = theme === 'dark'
    ? 'glass-card'
    : 'glass-card-light';

  const inputClass = theme === 'dark'
    ? 'input-field'
    : 'input-field-light';

  const bgClass = theme === 'dark' ? 'bg-navy-950' : 'bg-slate-50';
  const textClass = theme === 'dark' ? 'text-navy-100' : 'text-black';
  const mutedTextClass = theme === 'dark' ? 'text-navy-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Background gradient for light mode */}
      {theme === 'light' && (
        <div className="fixed inset-0 bg-slate-100/50 pointer-events-none -z-10" />
      )}

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
            <LogIn className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className={`text-2xl font-bold ${textClass} mb-2`}>Welcome back</h1>
          <p className={mutedTextClass}>Sign in to your account to continue</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className={`block text-sm font-medium ${textClass} mb-2`}>
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              className={inputClass}
              disabled={isLoading}
              autoComplete="username"
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
                placeholder="Enter your password"
                className={`${inputClass} pr-12`}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedTextClass} hover:text-primary-500 transition-colors`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className={`mt-6 text-center ${mutedTextClass}`}>
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
