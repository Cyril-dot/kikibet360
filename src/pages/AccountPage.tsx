import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { user as userApi, wallet, affiliate, auth } from '../utils/api';
import type { UpdateProfileRequest, Transaction } from '../utils/api';

import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import CircularProgress from '@mui/icons-material/Loop';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatUSD(amount: number) {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getUserInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const CREDIT_KINDS = new Set([
  'DEPOSIT',
  'BET_WIN',
  'REFERRAL_COMMISSION',
  'VIP_CASHBACK',
  'WELCOME_BONUS',
  'WITHDRAWAL_REFUND',
]);

function isCredit(kind: string) {
  return CREDIT_KINDS.has(kind);
}

// ---------------------------------------------------------------------------
// Geo lookup — tries ipapi.co first (CORS-safe, no key needed, 1k req/day),
// then falls back to ipwho.is (also CORS-safe, no key needed, unlimited).
// Both run in the browser. Fails silently — country field just stays empty.
// ---------------------------------------------------------------------------
async function fetchCountryCode(): Promise<string> {
  const timeout = 5_000;

  // Primary: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(timeout),
    });
    if (res.ok) {
      const data = await res.json();
      const code = (data.country_code as string | undefined) ?? '';
      if (code) return code;
    }
  } catch {
    // fall through to backup
  }

  // Fallback: ipwho.is
  try {
    const res = await fetch('https://ipwho.is/', {
      signal: AbortSignal.timeout(timeout),
    });
    if (res.ok) {
      const data = await res.json();
      const code = (data.country_code as string | undefined) ?? '';
      if (code) return code;
    }
  } catch {
    // both failed — return empty string
  }

  return '';
}

// ---------------------------------------------------------------------------
// Button primitives
// ---------------------------------------------------------------------------
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

function BtnPrimary({ children, loading, icon, size = 'md', className = '', disabled, ...rest }: BtnProps) {
  const sz =
    size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' :
    size === 'lg' ? 'w-full py-3 text-sm rounded-xl' :
                    'px-4 py-2.5 text-sm rounded-xl';
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold btn-primary',
        'active:scale-[0.97] transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        sz, className,
      ].join(' ')}
    >
      {loading
        ? <CircularProgress fontSize="small" className="animate-spin shrink-0" />
        : icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function BtnGhost({ children, loading, icon, size = 'md', className = '', disabled, style, ...rest }: BtnProps) {
  const sz =
    size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' :
    size === 'lg' ? 'w-full py-3 text-sm rounded-xl' :
                    'px-4 py-2.5 text-sm rounded-xl';
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={style}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-150 active:scale-[0.97]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        sz, className,
      ].join(' ')}
    >
      {loading
        ? <CircularProgress fontSize="small" className="animate-spin shrink-0" />
        : icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function BtnDanger({ children, icon, size = 'md', className = '', ...rest }: BtnProps) {
  const sz =
    size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' :
    size === 'lg' ? 'w-full py-3.5 text-sm rounded-2xl' :
                    'px-4 py-2.5 text-sm rounded-xl';
  return (
    <button
      {...rest}
      style={{
        color: '#e11d48',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid color-mix(in srgb, #f43f5e 25%, transparent)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, #f43f5e 8%, transparent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-bg)';
      }}
      className={[
        'inline-flex items-center justify-center gap-2 font-bold',
        'transition-all duration-150 active:scale-[0.98]',
        sz, className,
      ].join(' ')}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function BtnIcon({ children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}
      className={[
        'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Shared UI Atoms
// ---------------------------------------------------------------------------
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-sm ${className}`}
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--card-alt)' }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--text-muted)' }} className="flex items-center">{icon}</span>
        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          {title}
        </span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return (
    <div className={`${h} ${w} rounded-lg animate-pulse`} style={{ backgroundColor: 'var(--border-light)' }} />
  );
}

function TxKindBadge({ kind }: { kind: string }) {
  const credit = isCredit(kind);
  return (
    <span
      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide"
      style={
        credit
          ? { backgroundColor: 'color-mix(in srgb, #10b981 15%, transparent)', color: '#059669' }
          : { backgroundColor: 'color-mix(in srgb, #f43f5e 15%, transparent)', color: '#e11d48' }
      }
    >
      {kind.replace(/_/g, ' ')}
    </span>
  );
}

function InfoRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5"
      style={{ borderBottom: '1px solid var(--border-light)' }}
    >
      <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="text-right ml-4 min-w-0">
        <span className="text-sm font-semibold truncate block" style={{ color: 'var(--text-main)' }}>{value}</span>
        {sub && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
type TabId = 'overview' | 'profile' | 'preferences';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Overview',  icon: <TrendingUpIcon sx={{ fontSize: 20 }} /> },
  { id: 'profile',     label: 'Profile',   icon: <PersonIcon sx={{ fontSize: 20 }} /> },
  { id: 'preferences', label: 'More',      icon: <SettingsIcon sx={{ fontSize: 20 }} /> },
];

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{ width: 44, height: 24, backgroundColor: checked ? 'var(--primary)' : 'var(--border-light)' }}
    >
      <span
        className="inline-block w-[18px] h-[18px] rounded-full bg-white shadow-md transform transition-transform duration-200"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(3px)' }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main AccountPage
// ---------------------------------------------------------------------------
export default function AccountPage() {
  const { user, logout, showToast, login } = useAppStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [profileData, setProfileData]           = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading]     = useState(true);
  const [walletData, setWalletData]             = useState<Record<string, unknown> | null>(null);
  const [walletLoading, setWalletLoading]       = useState(true);
  const [transactions, setTransactions]         = useState<Transaction[]>([]);
  const [affiliateBalance, setAffiliateBalance] = useState<{ balance: number } | null>(null);

  const [editMode, setEditMode]       = useState(false);
  const [editForm, setEditForm]       = useState({ firstName: '', lastName: '', phone: '', country: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [geoLoading, setGeoLoading]   = useState(false);

  const [notifications, setNotifications] = useState({ push: true, sms: false, email: true });
  const [depositLimit, setDepositLimit]   = useState('');
  const [sessionLimit, setSessionLimit]   = useState('');

  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]       = useState({ current: false, next: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]     = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await userApi.me();
      if (res.success && res.data) {
        setProfileData(res.data);
        const d = res.data as Record<string, unknown>;
        setEditForm({
          firstName: (d.firstName as string) ?? '',
          lastName:  (d.lastName  as string) ?? '',
          phone:     (d.phone     as string) ?? '',
          country:   (d.country   as string) ?? '',
        });
      }
    } catch { /* silently fall back */ }
    finally { setProfileLoading(false); }
  }, []);

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const [walletRes, txRes, affRes] = await Promise.all([
        wallet.getWallet(),
        wallet.getTransactions(0, 5),
        affiliate.getBalance(),
      ]);
      if (walletRes.success) setWalletData(walletRes.data);
      if (txRes.success)     setTransactions(txRes.data.content);
      if (affRes.success) {
        const d = affRes.data as Record<string, unknown>;
        if (typeof d.balance === 'number')
          setAffiliateBalance({ balance: d.balance });
      }
    } catch { /* silently fail */ }
    finally { setWalletLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchWallet();
  }, [user, fetchProfile, fetchWallet]);

  // Auto-detect country when edit mode opens and country is empty
  const handleOpenEdit = useCallback(async () => {
    setEditMode(true);
    // Only auto-fetch if country is not already set
    if (!editForm.country) {
      setGeoLoading(true);
      const code = await fetchCountryCode();
      if (code) setEditForm((p) => ({ ...p, country: p.country || code }));
      setGeoLoading(false);
    }
  }, [editForm.country]);

  if (!user) return null;

  const apiFirstName = (profileData?.firstName as string) ?? '';
  const apiLastName  = (profileData?.lastName  as string) ?? '';
  const apiEmail     = (profileData?.email     as string) ?? user.email;
  const apiPhone     = (profileData?.phone     as string) ?? user.phone ?? '';
  const apiCountry   = (profileData?.country   as string) ?? '';
  const apiRole      = (profileData?.role      as string) ?? user.role;
  const displayName  = [apiFirstName, apiLastName].filter(Boolean).join(' ') || user.fullName;
  const roleLabel    = apiRole.replace('_', ' ');

  const walletBalance =
    typeof walletData?.balance === 'number'
      ? (walletData.balance as number)
      : typeof walletData?.availableBalance === 'number'
      ? (walletData.availableBalance as number)
      : null;

  const affBalance = affiliateBalance?.balance ?? null;

  const saveProfile = async () => {
    setEditLoading(true);
    try {
      const body: UpdateProfileRequest = {
        firstName: editForm.firstName.trim() || undefined,
        lastName:  editForm.lastName.trim()  || undefined,
        phone:     editForm.phone.trim()     || undefined,
        country:   editForm.country.trim()   || undefined,
      };
      const res = await userApi.update(body);
      if (res.success) {
        const newName = [res.data.firstName, res.data.lastName].filter(Boolean).join(' ') || user.fullName;
        login({ ...user, fullName: newName, phone: res.data.phone ?? user.phone });
        await fetchProfile();
        setEditMode(false);
        showToast('Profile updated!', 'success');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const changePassword = async () => {
    setPwError(null);
    setPwSuccess(false);
    if (!pwForm.current.trim())          { setPwError('Enter your current password.');           return; }
    if (pwForm.next.length < 8)          { setPwError('New password must be at least 8 chars.'); return; }
    if (pwForm.next !== pwForm.confirm)  { setPwError('Passwords do not match.');                return; }
    setPwLoading(true);
    try {
      await auth.resetPassword({ oldPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      setPwSuccess(true);
      showToast('Password updated successfully!', 'success');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await auth.logout(); } catch { /* ignore */ }
    logout();
    navigate('/');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--card-alt)' }}>

      {/* ═══ HERO HEADER ═══ */}
      <div style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="max-w-lg mx-auto">

          {/* Profile identity row */}
          <div className="flex items-center gap-3.5 px-4 pt-5 pb-4">
            <div className="relative shrink-0">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold select-none shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
              >
                {getUserInitials(displayName)}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-emerald-500"
                style={{ borderColor: 'var(--card-bg)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              {profileLoading ? (
                <div className="space-y-2">
                  <SkeletonLine w="w-32" h="h-5" />
                  <SkeletonLine w="w-44" h="h-3.5" />
                </div>
              ) : (
                <>
                  <h1 className="font-bold text-base leading-tight truncate" style={{ color: 'var(--text-main)' }}>
                    {displayName}
                  </h1>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {apiEmail}
                  </p>
                </>
              )}
            </div>
            {/* Role badge */}
            <span
              className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider"
              style={{
                backgroundColor:
                  apiRole === 'SUPER_ADMIN' ? 'color-mix(in srgb, #a855f7 15%, transparent)' :
                  apiRole === 'ADMIN'        ? 'color-mix(in srgb, #3b82f6 15%, transparent)' :
                  'var(--card-alt)',
                color:
                  apiRole === 'SUPER_ADMIN' ? '#9333ea' :
                  apiRole === 'ADMIN'        ? '#2563eb' :
                  'var(--text-muted)',
                border: '1px solid var(--border-light)',
              }}
            >
              {roleLabel}
            </span>
          </div>

          {/* Tab bar */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border-light)' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-all border-b-2"
                style={{
                  borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                  color:       activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <>
            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/wallet"
                className="rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-all"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}
                  >
                    <AccountBalanceWalletIcon sx={{ fontSize: 15 }} style={{ color: 'var(--primary)' }} />
                  </div>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                {walletLoading ? (
                  <SkeletonLine h="h-6" />
                ) : (
                  <p className="font-bold text-sm tabular-nums leading-tight" style={{ color: 'var(--text-main)' }}>
                    {walletBalance !== null ? formatUSD(walletBalance) : '—'}
                  </p>
                )}
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Main Wallet</p>
              </Link>

              <Link
                to="/affiliate"
                className="rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-all group"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'color-mix(in srgb, #10b981 12%, transparent)' }}
                  >
                    <GroupAddIcon sx={{ fontSize: 15 }} style={{ color: '#10b981' }} />
                  </div>
                  <OpenInNewIcon
                    sx={{ fontSize: 13 }}
                    style={{ color: 'var(--text-muted)' }}
                    className="group-hover:text-emerald-500 transition-colors"
                  />
                </div>
                {walletLoading ? (
                  <SkeletonLine h="h-6" />
                ) : (
                  <p className="font-bold text-sm tabular-nums leading-tight text-emerald-500">
                    {affBalance !== null ? formatUSD(affBalance) : '—'}
                  </p>
                )}
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Affiliate</p>
              </Link>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader
                icon={<AccountBalanceWalletIcon sx={{ fontSize: 15 }} />}
                title="Recent Transactions"
                action={
                  <div className="flex items-center gap-1">
                    <BtnIcon onClick={fetchWallet} title="Refresh transactions" aria-label="Refresh transactions">
                      <RefreshIcon sx={{ fontSize: 15 }} />
                    </BtnIcon>
                    <Link
                      to="/wallet"
                      className="text-[11px] font-bold hover:underline px-1"
                      style={{ color: 'var(--primary)' }}
                    >
                      View all
                    </Link>
                  </div>
                }
              />
              <div>
                {walletLoading ? (
                  [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center px-4 py-3.5 gap-3"
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                    >
                      <div className="space-y-2 flex-1">
                        <SkeletonLine w="w-24" h="h-4" />
                        <SkeletonLine w="w-16" h="h-3" />
                      </div>
                      <SkeletonLine w="w-20" h="h-5" />
                    </div>
                  ))
                ) : transactions.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <AccountBalanceWalletIcon
                      sx={{ fontSize: 30 }}
                      style={{ color: 'var(--border-light)' }}
                      className="mb-2"
                    />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet.</p>
                  </div>
                ) : (
                  transactions.map((tx) => {
                    const credit = isCredit(tx.kind);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between px-4 py-3.5 gap-3"
                        style={{ borderBottom: '1px solid var(--border-light)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <TxKindBadge kind={tx.kind} />
                          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className="text-sm font-bold tabular-nums"
                            style={{ color: credit ? '#10b981' : '#f43f5e' }}
                          >
                            {credit ? '+' : '-'}{formatUSD(tx.amount)}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Bal: {formatUSD(tx.balanceAfter)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* KYC */}
            <Card>
              <CardHeader icon={<VerifiedUserIcon sx={{ fontSize: 15 }} />} title="KYC Verification" />
              <div className="px-4 py-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                    Identity Verification
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {user.kycStatus === 'verified'
                      ? 'Your identity has been verified.'
                      : user.kycStatus === 'pending'
                      ? 'Verification is in progress.'
                      : 'Verify your identity to unlock all features.'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                    style={
                      user.kycStatus === 'verified'
                        ? { backgroundColor: 'color-mix(in srgb, #10b981 15%, transparent)', color: '#059669' }
                        : user.kycStatus === 'pending'
                        ? { backgroundColor: 'color-mix(in srgb, #f59e0b 15%, transparent)', color: '#d97706' }
                        : { backgroundColor: 'var(--card-alt)', color: 'var(--text-muted)' }
                    }
                  >
                    {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
                  </span>
                  {user.kycStatus === 'unverified' && <BtnPrimary size="sm">Start KYC</BtnPrimary>}
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ─── PROFILE TAB ─── */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader
              icon={<PersonIcon sx={{ fontSize: 15 }} />}
              title="Personal Info"
              action={
                !editMode && (
                  <button
                    onClick={handleOpenEdit}
                    className="flex items-center gap-1 text-xs font-bold hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    <EditIcon sx={{ fontSize: 13 }} />
                    Edit
                  </button>
                )
              }
            />
            {editMode ? (
              <div className="px-4 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(['firstName', 'lastName'] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {field === 'firstName' ? 'First Name' : 'Last Name'}
                      </label>
                      <input
                        type="text"
                        value={editForm[field]}
                        onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))}
                        className="input-field"
                        disabled={editLoading}
                        placeholder={field === 'firstName' ? 'First' : 'Last'}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="input-field"
                    disabled={editLoading}
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Country
                    {geoLoading && (
                      <span className="ml-2 text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                        (detecting…)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))}
                    className="input-field"
                    disabled={editLoading || geoLoading}
                    placeholder={geoLoading ? 'Detecting…' : 'e.g. GH'}
                    maxLength={2}
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <BtnGhost
                    onClick={() => setEditMode(false)}
                    disabled={editLoading}
                    icon={<CloseIcon fontSize="small" />}
                    className="flex-1"
                    style={{
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-muted)',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                  >
                    Cancel
                  </BtnGhost>
                  <BtnPrimary
                    onClick={saveProfile}
                    loading={editLoading}
                    icon={<SaveIcon fontSize="small" />}
                    className="flex-1 py-3 rounded-xl"
                  >
                    {editLoading ? 'Saving…' : 'Save Changes'}
                  </BtnPrimary>
                </div>
              </div>
            ) : (
              <div>
                {profileLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center px-4 py-3.5"
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                    >
                      <SkeletonLine w="w-20" h="h-3.5" />
                      <SkeletonLine w="w-28" h="h-3.5" />
                    </div>
                  ))
                ) : (
                  <>
                    <InfoRow label="Full Name" value={displayName || '—'} />
                    <InfoRow label="Email"     value={apiEmail    || '—'} />
                    <InfoRow label="Phone"     value={apiPhone    || '—'} />
                    <InfoRow label="Country"   value={apiCountry  || '—'} />
                    <InfoRow label="Role"      value={roleLabel} />
                  </>
                )}
              </div>
            )}
          </Card>
        )}

        {/* ─── PREFERENCES TAB ─── */}
        {activeTab === 'preferences' && (
          <>
            {/* Notifications */}
            <Card>
              <CardHeader icon={<NotificationsIcon sx={{ fontSize: 15 }} />} title="Notifications" />
              <div>
                {(
                  [
                    { key: 'push',  label: 'Push Notifications',  sub: 'In-app alerts & updates' },
                    { key: 'sms',   label: 'SMS Alerts',          sub: 'Text messages to your phone' },
                    { key: 'email', label: 'Email Notifications', sub: 'Updates sent to your inbox' },
                  ] as const
                ).map(({ key, label, sub }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3.5 gap-3"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{label}</p>
                      <p className="text-xs mt-0.5"        style={{ color: 'var(--text-muted)' }}>{sub}</p>
                    </div>
                    <Toggle
                      checked={notifications[key]}
                      onChange={() => setNotifications((p) => ({ ...p, [key]: !p[key] }))}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader icon={<VerifiedUserIcon sx={{ fontSize: 15 }} />} title="Change Password" />
              <div className="px-4 py-5 space-y-5">

                {pwError && (
                  <div
                    className="flex items-start gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #f43f5e 10%, transparent)',
                      border: '1px solid color-mix(in srgb, #f43f5e 25%, transparent)',
                      color: '#e11d48',
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} className="shrink-0 mt-0.5" />
                    <span>{pwError}</span>
                  </div>
                )}
                {pwSuccess && (
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #10b981 10%, transparent)',
                      border: '1px solid color-mix(in srgb, #10b981 25%, transparent)',
                      color: '#059669',
                    }}
                  >
                    <span>✓ Password updated successfully.</span>
                  </div>
                )}

                <div
                  className="overflow-hidden"
                  style={{ border: '1px solid var(--border-light)', borderRadius: 16 }}
                >
                  {(
                    [
                      { label: 'Current Password', field: 'current' as const },
                      { label: 'New Password',     field: 'next'    as const },
                      { label: 'Confirm New',      field: 'confirm' as const },
                    ]
                  ).map(({ label, field }, idx, arr) => (
                    <div
                      key={field}
                      className="relative"
                      style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}
                    >
                      <label
                        className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-wider pointer-events-none select-none"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {label}
                      </label>
                      <input
                        type={showPw[field] ? 'text' : 'password'}
                        value={pwForm[field]}
                        onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
                        disabled={pwLoading}
                        placeholder="••••••••"
                        autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                        style={{
                          display: 'block',
                          width: '100%',
                          paddingTop: '2rem',
                          paddingBottom: '0.75rem',
                          paddingLeft: '1rem',
                          paddingRight: '3rem',
                          backgroundColor: 'var(--card-bg)',
                          color: 'var(--text-main)',
                          fontSize: 15,
                          fontWeight: 500,
                          outline: 'none',
                          border: 'none',
                          letterSpacing: showPw[field] ? 'normal' : '0.1em',
                        }}
                        onFocus={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.backgroundColor = 'var(--card-alt)';
                        }}
                        onBlur={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.backgroundColor = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                        tabIndex={-1}
                        aria-label={showPw[field] ? 'Hide password' : 'Show password'}
                        className="absolute right-0 top-0 h-full w-12 flex items-center justify-center transition-opacity hover:opacity-60"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {showPw[field]
                          ? <VisibilityOffIcon sx={{ fontSize: 20 }} />
                          : <VisibilityIcon   sx={{ fontSize: 20 }} />}
                      </button>
                    </div>
                  ))}
                </div>

                {pwForm.next.length > 0 && (() => {
                  const strength =
                    pwForm.next.length >= 12 ? 4 :
                    pwForm.next.length >= 10 ? 3 :
                    pwForm.next.length >= 8  ? 2 : 1;
                  const strengthColor =
                    strength >= 4 ? '#10b981' : strength >= 3 ? '#f59e0b' : '#f43f5e';
                  const strengthLabel =
                    strength >= 4 ? 'Strong' : strength >= 3 ? 'Good' : strength >= 2 ? 'Weak' : 'Too short';
                  return (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((lvl) => (
                          <div
                            key={lvl}
                            className="flex-1 h-1.5 rounded-full transition-all duration-300"
                            style={{ backgroundColor: lvl <= strength ? strengthColor : 'var(--border-light)' }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold" style={{ color: strengthColor }}>
                          {strengthLabel}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {pwForm.next.length} characters
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <BtnPrimary onClick={changePassword} loading={pwLoading} size="lg">
                  {pwLoading ? 'Updating…' : 'Update Password'}
                </BtnPrimary>
              </div>
            </Card>

            {/* Responsible Gambling */}
            <Card>
              <CardHeader icon={<VerifiedUserIcon sx={{ fontSize: 15 }} />} title="Responsible Gambling" />
              <div className="px-4 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Daily Deposit Limit (USD)
                  </label>
                  <input
                    type="number"
                    value={depositLimit}
                    onChange={(e) => setDepositLimit(e.target.value)}
                    placeholder="No limit set"
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Session Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={sessionLimit}
                    onChange={(e) => setSessionLimit(e.target.value)}
                    placeholder="No limit set"
                    className="input-field"
                    min="0"
                  />
                </div>
                <BtnPrimary size="lg">Save Limits</BtnPrimary>
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                  <BtnDanger size="lg">Self-Exclusion</BtnDanger>
                </div>
              </div>
            </Card>

            {/* Sign Out */}
            <BtnDanger size="lg" icon={<LogoutIcon fontSize="small" />} onClick={handleLogout}>
              Sign Out
            </BtnDanger>
          </>
        )}
      </div>
    </div>
  );
}