import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { auth } from '../utils/api';
import { saveSession } from './LoginPage'; // Assuming LoginPage is in the same directory
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

// ---------------------------------------------------------------------------
// Password strength checker
// ---------------------------------------------------------------------------
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { score: 1, label: 'Weak',   color: '#ef4444' },
    { score: 2, label: 'Fair',   color: '#f97316' },
    { score: 3, label: 'Good',   color: '#eab308' },
    { score: 4, label: 'Strong', color: '#22c55e' },
  ];
  // Adjust index for 0-based array from 1-based score
  return map[score - 1] ?? { score: 0, label: '', color: '' };
}

// ---------------------------------------------------------------------------
// Styled input helper
// ---------------------------------------------------------------------------
function StyledInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  inputMode,
  disabled,
  required,
  className = '',
  children,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  disabled?: boolean;
  required?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all touch-manipulation ${className}`}
        style={{
          backgroundColor: 'var(--card-alt)',
          border: '1.5px solid var(--border-light)',
          color: 'var(--text-main)',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Label helper
// ---------------------------------------------------------------------------
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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
  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [terms, setTerms]                           = useState(false);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState<string | null>(null);

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
    if (!pwMatch) { // Use pwMatch state for clearer error
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

      showToast('Welcome to Applet Bet! 🎉', 'success');

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
    <div
      className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      {/* ── Left decorative panel — hidden on mobile ── */}
      <div
        className="hidden md:flex w-80 xl:w-96 shrink-0 items-center justify-center p-10 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
        <div className="absolute -bottom-24 -right-12 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />

        <div className="relative text-white text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <SportsSoccerIcon sx={{ fontSize: 36 }} />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Super Bet</h1>
          <p className="text-xs font-semibold tracking-[3px] uppercase opacity-60 mb-5">Join Today</p>

          {/* Bonus badge */}
          <div className="rounded-2xl p-4 mb-6 text-left" style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Welcome Bonus</p>
            <p className="text-2xl font-black">100% up to GH₵1,000</p>
            <p className="text-xs opacity-70 mt-1">On your first deposit</p>
          </div>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {[
              'Create your account',
              'Make your first deposit',
              'Start betting & winning!',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  {i + 1}
                </div>
                <p className="text-sm font-medium opacity-90">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile top banner ── */}
      <div
        className="md:hidden px-5 py-5 text-white"
        style={{ background: `linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%)` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <SportsSoccerIcon fontSize="small" />
          </div>
          <div>
            <p className="font-black text-lg tracking-tight leading-none">Super Bet</p>
            <p className="text-xs opacity-70 mt-0.5">Sports Betting</p>
          </div>
        </div>
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <p className="text-sm font-bold">🎁 100% First Deposit Bonus up to GH₵1,000</p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-start justify-center p-5 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-2">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--text-main)' }}>
              Create Account
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Fill in your details to get started.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-2xl text-sm flex items-start gap-2"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
              }}
            >
              <span className="mt-0.5 shrink-0">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>First Name <span style={{ color: 'var(--primary)' }}>*</span></FieldLabel>
                <StyledInput
                  placeholder="John"
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  autoComplete="given-name"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <FieldLabel>Last Name <span style={{ color: 'var(--primary)' }}>*</span></FieldLabel>
                <StyledInput
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  autoComplete="family-name"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <FieldLabel>
                Phone Number{' '}
                <span className="normal-case font-normal" style={{ color: 'var(--text-muted)', letterSpacing: 0 }}>
                  (optional)
                </span>
              </FieldLabel>
              <StyledInput
                type="tel"
                placeholder="+233 XX XXX XXXX"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <FieldLabel>Email <span style={{ color: 'var(--primary)' }}>*</span></FieldLabel>
              <StyledInput
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                autoComplete="email"
                inputMode="email"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div>
              <FieldLabel>Password <span style={{ color: 'var(--primary)' }}>*</span></FieldLabel>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-2xl text-sm font-medium outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--card-alt)',
                    border: '1.5px solid var(--border-light)',
                    color: 'var(--text-main)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors touch-manipulation"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-main)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </button>
              </div>

              {/* Password strength */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= pwStrength.score ? pwStrength.color : 'var(--border-light)',
                        }}
                      />
                    ))}
                  </div>
                  {pwStrength.label && (
                    <p className="text-xs font-semibold" style={{ color: pwStrength.color }}>
                      {pwStrength.label} password
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <FieldLabel>Confirm Password <span style={{ color: 'var(--primary)' }}>*</span></FieldLabel>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 pr-14 rounded-2xl text-sm font-medium outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--card-alt)',
                    border: form.confirmPassword
                      ? `1.5px solid ${pwMatch ? '#22c55e' : '#ef4444'}`
                      : '1.5px solid var(--border-light)',
                    color: 'var(--text-main)',
                  }}
                  onFocus={e => {
                    if (!form.confirmPassword) {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent)';
                    }
                  }}
                  onBlur={e => {
                    if (!form.confirmPassword) {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {form.confirmPassword && (
                    <CheckCircleIcon
                      fontSize="small"
                      style={{ color: pwMatch ? '#22c55e' : '#ef4444' }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                    className="p-1 rounded-lg transition-colors touch-manipulation"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-main)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </button>
                </div>
              </div>
              {form.confirmPassword && !pwMatch && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords don't match</p>
              )}
            </div>

            {/* Referral code */}
            <div>
              <FieldLabel>
                Referral Code{' '}
                <span className="normal-case font-normal" style={{ color: 'var(--text-muted)', letterSpacing: 0 }}>
                  (optional)
                </span>
              </FieldLabel>
              <StyledInput
                placeholder="e.g. REF123ABC"
                value={form.referralCode}
                onChange={e => update('referralCode', e.target.value.toUpperCase())}
                autoComplete="off"
                disabled={loading}
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div
                className="relative w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center transition-all"
                style={{
                  backgroundColor: terms ? 'var(--primary)' : 'var(--card-alt)',
                  border: `1.5px solid ${terms ? 'var(--primary)' : 'var(--border-light)'}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  disabled={loading}
                />
                {terms && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
                I agree to the{' '}
                <Link to="/terms" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                  Terms & Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !terms}
              className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary)', color: '#fff', minHeight: '52px' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
          </div>

          <p className="text-center text-sm pb-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>
              Log In
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}