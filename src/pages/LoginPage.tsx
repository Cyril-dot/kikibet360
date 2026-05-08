import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { auth } from '../utils/api';
import type { AuthResponse } from '../utils/api';
import LoginIcon from '@mui/icons-material/Login';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CircularProgress from '@mui/icons-material/Loop';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
export const TOKEN_KEY = 'accessToken';
export const USER_KEY  = 'currentUser';

export function saveSession(data: AuthResponse, remember: boolean): void {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, data.accessToken);
  storage.setItem(USER_KEY, JSON.stringify(data.user));
  // Always write to localStorage so api.ts getAuthHeader() can find it
  if (!remember) {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// Map the API role string → the two roles your store's User type accepts
function mapRole(apiRole: string): 'user' | 'admin' {
  if (apiRole === 'ADMIN' || apiRole === 'admin') return 'admin';
  if (apiRole === 'SUPER_ADMIN' || apiRole === 'super_admin') return 'admin';
  return 'user';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, showToast } = useAppStore();

  const [form, setForm]                 = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await auth.login({ email: form.email.trim(), password: form.password });

      if (!res.success || !res.data?.accessToken) {
        throw new Error(res.message ?? 'Login failed. Please try again.');
      }

      const { user: apiUser } = res.data;

      // Persist token to localStorage (api.ts reads from 'accessToken')
      saveSession(res.data, remember);

      // Sync with Zustand store — token is stored separately, not in User type
      login({
        id:           apiUser.id,
        fullName:     [apiUser.firstName, apiUser.lastName].filter(Boolean).join(' ') || apiUser.email,
        phone:        apiUser.phone ?? '',
        email:        apiUser.email,
        role:         mapRole(apiUser.role),
        kycStatus:    'verified',
        referralCode: '',
      });

      showToast('Login successful!', 'success');

      if (res.data.mustSetup2fa) {
        navigate('/setup-2fa');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">

      {/* Left decorative panel */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-red-800 items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <SportsSoccerIcon sx={{ fontSize: 64 }} className="mx-auto mb-6" />
          <h1 className="font-heading text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-lg opacity-90">
            Log in to your Futball account and continue betting on your favorite sports.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2 mb-6">
            <SportsSoccerIcon className="text-primary" fontSize="large" />
            <span className="font-heading text-2xl font-bold text-primary">Futball</span>
          </div>

          <h2 className="font-heading text-2xl font-bold mb-2">Login</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Enter your credentials to access your account.
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input-field"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="input-field pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <VisibilityOffIcon fontSize="small" />
                    : <VisibilityIcon fontSize="small" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600"
                  disabled={loading}
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary font-medium hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <CircularProgress fontSize="small" className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LoginIcon fontSize="small" />
                  Login
                </>
              )}
            </button>

          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}