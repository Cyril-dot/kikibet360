import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { auth } from '../utils/api';
import { saveSession } from './LoginPage';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CircularProgress from '@mui/icons-material/Loop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function mapRole(apiRole: string): 'user' | 'admin' {
  if (apiRole === 'ADMIN' || apiRole === 'admin') return 'admin';
  if (apiRole === 'SUPER_ADMIN' || apiRole === 'super_admin') return 'admin';
  return 'user';
}

// Password strength checker
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { score: 1, label: 'Weak',    color: 'bg-red-500' },
    { score: 2, label: 'Fair',    color: 'bg-orange-400' },
    { score: 3, label: 'Good',    color: 'bg-yellow-400' },
    { score: 4, label: 'Strong',  color: 'bg-green-500' },
  ];
  return map[score - 1] ?? { score: 0, label: '', color: '' };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, showToast } = useAppStore();

  const [form, setForm] = useState({
    firstName:       '',
    lastName:        '',
    phone:           '',
    email:           '',
    password:        '',
    confirmPassword: '',
    referralCode:    searchParams.get('ref') ?? '',
  });
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [terms, setTerms]                       = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  // Auto-fill ref from URL ?ref=CODE
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setForm(p => ({ ...p, referralCode: ref }));
  }, [searchParams]);

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const pwStrength = getPasswordStrength(form.password);
  const pwMatch    = form.confirmPassword && form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!terms) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await auth.register({
        email:     form.email.trim(),
        password:  form.password,
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        phone:     form.phone.trim() || undefined,
        ref:       form.referralCode.trim() || undefined,
      });

      if (!res.success || !res.data?.accessToken) {
        throw new Error(res.message ?? 'Registration failed. Please try again.');
      }

      const { user: apiUser } = res.data;
      saveSession(res.data, false);

      login({
        id:           apiUser.id,
        fullName:     [apiUser.firstName, apiUser.lastName].filter(Boolean).join(' ') || apiUser.email,
        phone:        apiUser.phone ?? '',
        email:        apiUser.email,
        role:         mapRole(apiUser.role),
        kycStatus:    'unverified',
        referralCode: '',
      });

      showToast('Welcome to Futball! 🎉', 'success');

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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row">

      {/* ── Left decorative panel — hidden on mobile ── */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-red-800 items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <SportsSoccerIcon sx={{ fontSize: 64 }} className="mx-auto mb-6" />
          <h1 className="font-heading text-4xl font-bold mb-4">Join Futball</h1>
          <p className="text-lg opacity-90 mb-6">
            Get 100% First Deposit Bonus up to GH₵1,000 when you sign up today!
          </p>
          <div className="space-y-3 text-left bg-white/10 rounded-xl p-6">
            {[
              'Create your account',
              'Make your first deposit',
              'Start betting and winning!',
            ].map((step, i) => (
              <p key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                {step}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile top banner ── */}
      <div className="md:hidden bg-gradient-to-r from-primary to-red-700 px-5 py-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <SportsSoccerIcon fontSize="medium" />
          <span className="font-heading text-xl font-bold">Futball</span>
        </div>
        <p className="text-sm opacity-90 font-medium">
          🎁 100% First Deposit Bonus up to GH₵1,000
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-start md:items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md py-2">

          <h2 className="font-heading text-2xl font-bold mb-1">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Fill in your details to get started.
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name row — stacks on very small screens */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  className="input-field"
                  autoComplete="given-name"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  className="input-field"
                  autoComplete="family-name"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone Number <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="+233 XX XXX XXXX"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                className="input-field"
                autoComplete="tel"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className="input-field"
                autoComplete="email"
                inputMode="email"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  className="input-field pr-11"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 touch-manipulation"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </button>
              </div>

              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          i <= pwStrength.score ? pwStrength.color : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  {pwStrength.label && (
                    <p className={`text-xs font-medium ${
                      pwStrength.score <= 1 ? 'text-red-500'
                      : pwStrength.score === 2 ? 'text-orange-500'
                      : pwStrength.score === 3 ? 'text-yellow-600'
                      : 'text-green-600'
                    }`}>
                      {pwStrength.label} password
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  className={`input-field pr-11 transition-colors ${
                    form.confirmPassword
                      ? pwMatch
                        ? 'border-green-400 dark:border-green-600 focus:ring-green-400'
                        : 'border-red-400 dark:border-red-600 focus:ring-red-400'
                      : ''
                  }`}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {form.confirmPassword && (
                    <CheckCircleIcon
                      fontSize="small"
                      className={`transition-colors ${pwMatch ? 'text-green-500' : 'text-red-400'}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 touch-manipulation"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </button>
                </div>
              </div>
              {form.confirmPassword && !pwMatch && (
                <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
              )}
            </div>

            {/* Referral code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Referral Code <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. REF123ABC"
                value={form.referralCode}
                onChange={e => update('referralCode', e.target.value)}
                className="input-field"
                autoCapitalize="characters"
                disabled={loading}
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary touch-manipulation"
                  disabled={loading}
                />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:underline font-medium">Terms & Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !terms}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] text-base touch-manipulation"
            >
              {loading ? (
                <>
                  <CircularProgress fontSize="small" className="animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <PersonAddIcon fontSize="small" />
                  Create Account
                </>
              )}
            </button>

          </form>

          <p className="text-center text-sm text-slate-500 mt-5 pb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}