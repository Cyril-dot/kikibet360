import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { wallet } from '../../utils/api';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CasinoIcon from '@mui/icons-material/Casino';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const navLinks = [
  { to: '/', label: 'Home', icon: <SportsSoccerIcon fontSize="small" /> },
  { to: '/live', label: 'Live', icon: <FiberManualRecordIcon className="text-green-500 animate-pulse-green" fontSize="small" /> },
  { to: '/casino', label: 'Casino', icon: <CasinoIcon fontSize="small" /> },
  { to: '/promos', label: 'Promos', icon: <LocalOfferIcon fontSize="small" /> },
  { to: '/affiliate', label: 'Affiliate', icon: <GroupAddIcon fontSize="small" /> },
];

function getUserInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Header() {
  const { theme, toggleTheme, user } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletCurrency, setWalletCurrency] = useState<string>('GHS');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceFlash, setBalanceFlash] = useState(false);
  const location = useLocation();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevBalanceRef = useRef<number | null>(null);

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!user) return;
    try {
      const res = await wallet.getWallet();
      if (res.success && res.data) {
        const data = res.data as Record<string, unknown>;
        const newBalance =
          typeof data.balance === 'number'
            ? data.balance
            : typeof data.availableBalance === 'number'
            ? data.availableBalance
            : null;

        const currency =
          typeof data.currency === 'string' ? data.currency : 'GHS';

        if (newBalance !== null) {
          // Flash animation when balance changes
          if (prevBalanceRef.current !== null && prevBalanceRef.current !== newBalance) {
            setBalanceFlash(true);
            setTimeout(() => setBalanceFlash(false), 600);
          }
          prevBalanceRef.current = newBalance;
          setWalletBalance(newBalance);
          setWalletCurrency(currency);
        }
      }
    } catch {
      // Silently fail — balance just won't update
    }
  };

  // Poll wallet every 15 seconds when logged in
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatBalance = (amount: number) =>
    amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <SportsSoccerIcon className="text-primary" fontSize="medium" />
          <span className="font-heading text-xl sm:text-2xl font-bold text-primary">Futball</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
            aria-label="Toggle theme"
          >
            {theme === 'light'
              ? <DarkModeIcon className="text-slate-600" fontSize="small" />
              : <LightModeIcon className="text-yellow-400" fontSize="small" />}
          </button>

          {user ? (
            /* ── Logged-in state ── */
            <div className="flex items-center gap-2">

              {/* Live wallet balance pill */}
              <Link
                to="/wallet"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all touch-manipulation
                  ${balanceFlash
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20 scale-105'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                title="Wallet balance"
              >
                {/* Live indicator dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>

                <AccountBalanceWalletIcon
                  fontSize="small"
                  className="text-slate-400 dark:text-slate-500"
                  sx={{ fontSize: 14 }}
                />

                {balanceLoading && walletBalance === null ? (
                  <span className="text-xs text-slate-400 w-12 animate-pulse">Loading…</span>
                ) : walletBalance !== null ? (
                  <span className={`text-sm font-bold tabular-nums transition-colors ${
                    balanceFlash ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    {walletCurrency} {formatBalance(walletBalance)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </Link>

              {/* User avatar + name */}
              <Link
                to="/account"
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                  {getUserInitials(user.fullName)}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200">
                  {user.fullName.split(' ')[0]}
                </span>
              </Link>
            </div>
          ) : (
            /* ── Logged-out state ── */
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-manipulation"
              >
                <LoginIcon fontSize="small" />
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3 sm:px-5 touch-manipulation"
              >
                <PersonAddIcon fontSize="small" />
                <span className="hidden xs:inline">Register</span>
                <span className="xs:hidden">Join</span>
              </Link>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 animate-fade-in">
          <nav className="flex flex-col p-3 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] touch-manipulation ${
                  location.pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-2 flex flex-col gap-1">
              {user ? (
                <>
                  {/* Mobile wallet balance */}
                  <Link
                    to="/wallet"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 min-h-[48px] touch-manipulation"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <AccountBalanceWalletIcon fontSize="small" />
                      Wallet Balance
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                        {walletBalance !== null
                          ? `${walletCurrency} ${formatBalance(walletBalance)}`
                          : '—'}
                      </span>
                    </div>
                  </Link>

                  {/* Account link */}
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[48px] touch-manipulation"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getUserInitials(user.fullName)}
                    </div>
                    {user.fullName.split(' ')[0]}'s Account
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[48px] touch-manipulation"
                  >
                    <LoginIcon fontSize="small" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary flex items-center justify-center gap-2 text-sm mt-1 min-h-[48px] touch-manipulation"
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