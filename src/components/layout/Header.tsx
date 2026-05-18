import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { wallet } from '../../utils/api';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomeIcon from '@mui/icons-material/Home';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CasinoIcon from '@mui/icons-material/Casino';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

// ---------------------------------------------------------------------------
// Nav links
// ---------------------------------------------------------------------------
const navLinks = [
  { to: '/',          label: 'Home',      icon: <HomeIcon sx={{ fontSize: 16 }} /> },
  {
    to: '/live',
    label: 'Live',
    icon: <FiberManualRecordIcon className="text-green-500 animate-pulse-green" sx={{ fontSize: 16 }} />
  },
  { to: '/casino',    label: 'Casino',    icon: <CasinoIcon sx={{ fontSize: 16 }} /> },
  { to: '/affiliate', label: 'Affiliate', icon: <GroupAddIcon sx={{ fontSize: 16 }} /> },
];

// ---------------------------------------------------------------------------
// Geo / currency detection
// ---------------------------------------------------------------------------
interface GeoInfo {
  currency: string;
  countryCode: string;
  source: string;
}
let geoCachePromise: Promise<GeoInfo> | null = null;
async function detectGeo(): Promise<GeoInfo> {
  if (!geoCachePromise) {
    geoCachePromise = fetch('/api/geo/currency')
      .then(r => {
        if (!r.ok) throw new Error('Geo fetch failed');
        return r.json() as Promise<GeoInfo>;
      })
      .catch(() => ({
        currency: 'GHS',
        countryCode: 'GH',
        source: 'fallback',
      }));
  }
  return geoCachePromise;
}

// ---------------------------------------------------------------------------
// Helper – user initials
// ---------------------------------------------------------------------------
function getUserInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/* ---------------------------------------------------------------
   SuperBetLogo – fixed so both words are visible on all themes.

   Light mode:  "Super" → primary blue   |  "Bet" → near-black
   Dark  mode:  "Super" → primary blue   |  "Bet" → white
   --------------------------------------------------------------- */
function SuperBetLogo() {
  return (
    <div className="flex items-center gap-1.5 font-display super-bet-logo select-none">
      {/* Football icon – primary blue on every theme */}
      <SportsSoccerIcon
        sx={{ fontSize: 20 }}
        style={{ color: 'var(--primary)' }}
        aria-hidden="true"
      />
      {/* "Super" – always the primary blue accent */}
      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
        Super
      </span>
      {/* "Bet" – text-main so it's black on light, white on dark */}
      <span style={{ color: 'var(--text-main)', fontWeight: 900 }}>
        Bet
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Header() {
  const { theme, toggleTheme, user } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // -------- Wallet state ----------
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletCurrency, setWalletCurrency] = useState<string>('GHS');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceFlash, setBalanceFlash] = useState(false);

  // -------- Geo / country ----------
  const [countryCode, setCountryCode] = useState<string>('GH');
  const [geoResolved, setGeoResolved] = useState(false);

  const location = useLocation();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevBalanceRef = useRef<number | null>(null);

  const isDark = theme.endsWith('-dark');

  // ---------------- Geo detection (once) ----------------
  useEffect(() => {
    detectGeo().then(g => {
      setCountryCode(g.countryCode);
      setWalletCurrency(prev => (prev === 'GHS' ? g.currency : prev));
      setGeoResolved(true);
    });
  }, []);

  // ---------------- Wallet polling ----------------
  const fetchBalance = async () => {
    if (!user) return;
    try {
      const res = await wallet.getWallet();
      if (res.success && res.data) {
        const d = res.data as Record<string, unknown>;

        const newBal =
          typeof d.balance === 'number'
            ? d.balance
            : typeof d.availableBalance === 'number'
            ? d.availableBalance
            : null;

        if (typeof d.currency === 'string') setWalletCurrency(d.currency);

        if (newBal !== null) {
          if (prevBalanceRef.current !== null && prevBalanceRef.current !== newBal) {
            setBalanceFlash(true);
            setTimeout(() => setBalanceFlash(false), 600);
          }
          prevBalanceRef.current = newBal;
          setWalletBalance(newBal);
        }
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!user) {
      setWalletBalance(null);
      prevBalanceRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    setBalanceLoading(true);
    fetchBalance().finally(() => setBalanceLoading(false));

    pollRef.current = setInterval(fetchBalance, 15_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user]);

  // ---------------- Helpers ----------------
  const formatBalance = (a: number) =>
    a.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const countryFlag = countryCode
    ? String.fromCodePoint(
        ...[...countryCode.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)
      )
    : '';

  // ---------------- Render ----------------
  return (
    <header
      className="sticky top-0 z-50 border-b shadow-sm"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-light)' }}
    >
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">

        {/* ---------- LOGO ---------- */}
        <Link to="/" className="flex items-center shrink-0">
          <SuperBetLogo />
        </Link>

        {/* ---------- DESKTOP NAV ---------- */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map(l => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: active ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '';
                }}
              >
                {l.icon}
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.01em' }}>
                  {l.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ---------- RIGHT ACTIONS ---------- */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* Country flag pill – desktop only */}
          {geoResolved && countryFlag && (
            <span
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold select-none"
              style={{
                backgroundColor: 'var(--card-alt)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-light)',
              }}
              title={`Detected country: ${countryCode}`}
            >
              <span className="text-base leading-none">{countryFlag}</span>
              <span>{countryCode}</span>
            </span>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <LightModeIcon fontSize="small" className="text-yellow-400" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </button>

          {/* USER LOGGED IN */}
          {user ? (
            <div className="flex items-center gap-2">

              {/* Wallet balance pill */}
              <Link
                to="/wallet"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all touch-manipulation"
                style={{
                  borderColor: balanceFlash ? '#4ade80' : 'var(--border-light)',
                  backgroundColor: balanceFlash
                    ? 'color-mix(in srgb, #4ade80 15%, transparent)'
                    : 'var(--card-alt)',
                }}
                title="Wallet balance"
              >
                {/* Green live dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <AccountBalanceWalletIcon sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                {balanceLoading && walletBalance === null ? (
                  <span className="text-xs w-12 animate-pulse" style={{ color: 'var(--text-muted)' }}>
                    Loading…
                  </span>
                ) : walletBalance !== null ? (
                  <span className="text-sm font-bold tabular-nums"
                    style={{ color: balanceFlash ? '#16a34a' : 'var(--text-main)' }}>
                    {walletCurrency} {formatBalance(walletBalance)}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </Link>

              {/* User avatar + name */}
              <Link
                to="/account"
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors touch-manipulation"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 select-none"
                  style={{ backgroundColor: 'var(--primary-dark)' }}
                >
                  {getUserInitials(user.fullName)}
                </div>
                <span className="hidden sm:inline text-sm font-medium"
                  style={{ color: 'var(--text-main)' }}>
                  {user.fullName.split(' ')[0]}
                </span>
              </Link>
            </div>
          ) : (
            /* USER NOT LOGGED IN */
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Login – hidden on mobile */}
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation"
                style={{ color: 'var(--text-main)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
              >
                <LoginIcon fontSize="small" />
                Login
              </Link>

              {/* Register – primary blue button */}
              <Link
                to="/register"
                className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4 sm:px-5 rounded-full touch-manipulation font-semibold"
              >
                <PersonAddIcon fontSize="small" />
                <span className="hidden xs:inline">Register</span>
                <span className="xs:hidden">Join</span>
              </Link>
            </div>
          )}

          {/* Hamburger – mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg transition-colors touch-manipulation"
            style={{ color: 'var(--text-main)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
          </button>
        </div>
      </div>

      {/* ------------------- MOBILE MENU ------------------- */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t animate-fade-in"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-light)' }}
        >
          <nav className="flex flex-col p-3 gap-1">
            {/* Nav links */}
            {navLinks.map(l => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[48px] touch-manipulation"
                  style={{
                    backgroundColor: active ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                >
                  {l.icon}
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {l.label}
                  </span>
                </Link>
              );
            })}

            {/* Bottom block (geo, wallet, account, login/register) */}
            <div className="border-t mt-1 pt-2 flex flex-col gap-1" style={{ borderColor: 'var(--border-light)' }}>
              {/* Geo info pill on mobile */}
              {geoResolved && countryFlag && (
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'var(--card-alt)', color: 'var(--text-muted)' }}
                >
                  <span className="text-base leading-none">{countryFlag}</span>
                  <span>{countryCode} · {walletCurrency}</span>
                </div>
              )}

              {user ? (
                <>
                  {/* Wallet */}
                  <Link
                    to="/wallet"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg min-h-[48px] touch-manipulation"
                    style={{ backgroundColor: 'var(--card-alt)' }}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      <AccountBalanceWalletIcon fontSize="small" />
                      Wallet Balance
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-main)' }}>
                        {walletBalance !== null
                          ? `${walletCurrency} ${formatBalance(walletBalance)}`
                          : '—'}
                      </span>
                    </div>
                  </Link>

                  {/* Account */}
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium min-h-[48px] touch-manipulation"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: 'var(--primary-dark)' }}
                    >
                      {getUserInitials(user.fullName)}
                    </div>
                    {user.fullName.split(' ')[0]}'s Account
                  </Link>
                </>
              ) : (
                <>
                  {/* Login */}
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium min-h-[48px] touch-manipulation"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                  >
                    <LoginIcon fontSize="small" />
                    Login
                  </Link>

                  {/* Register – primary button */}
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary flex items-center justify-center gap-2 text-sm mt-1 min-h-[48px] rounded-full touch-manipulation font-semibold"
                  >
                    <PersonAddIcon fontSize="small" />
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}