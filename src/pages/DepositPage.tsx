import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { deposits, wallet as walletApi } from '../utils/api';
import AddCardIcon from '@mui/icons-material/AddCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'form' | 'processing' | 'success' | 'error';

// ── Country → Paystack currency + channel ─────────────────────────────────────
//   Only GH and NG are live on Paystack mobile_money.
//   All other countries fall back to GH config.

interface PaystackConfig {
  currency: string;
  channel: string;
}

function getPaystackConfig(countryCode: string): PaystackConfig {
  switch (countryCode.toUpperCase()) {
    case 'NG': return { currency: 'NGN', channel: 'mobile_money' };
    case 'GH':
    default:   return { currency: 'GHS', channel: 'mobile_money' };
  }
}

// ── Geo / IP detection ────────────────────────────────────────────────────────
//   We try three sources in order and always resolve (never throw).

interface GeoInfo {
  currency: string;      // local ISO-4217 code, e.g. "GHS"
  countryCode: string;   // ISO-3166-1 alpha-2, e.g. "GH"
  countryName: string;
  source: 'backend' | 'ip-api' | 'ipapi-co' | 'fallback';
}

async function fetchGeoInfo(): Promise<GeoInfo> {
  // 1) Own backend proxy (avoids browser CORS + rate limits)
  try {
    const res = await fetch('/api/geo/currency');
    if (res.ok) {
      const d = await res.json();
      if (d.countryCode && d.currency) {
        return {
          currency:    d.currency,
          countryCode: d.countryCode,
          countryName: d.countryName ?? d.countryCode,
          source:      'backend',
        };
      }
    }
  } catch { /* fall through */ }

  // 2) ip-api.com  (free, 1 000 req/min, no key needed)
  try {
    const res = await fetch(
      'http://ip-api.com/json/?fields=status,countryCode,country,currency',
      { signal: AbortSignal.timeout(4000) },
    );
    if (res.ok) {
      const d = await res.json();
      if (d.status === 'success' && d.countryCode && d.currency) {
        return {
          currency:    d.currency,
          countryCode: d.countryCode,
          countryName: d.country,
          source:      'ip-api',
        };
      }
    }
  } catch { /* fall through */ }

  // 3) ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const d = await res.json();
      if (d.country_code && d.currency) {
        return {
          currency:    d.currency,
          countryCode: d.country_code,
          countryName: d.country_name ?? d.country_code,
          source:      'ipapi-co',
        };
      }
    }
  } catch { /* fall through */ }

  // 4) Hard fallback → Ghana
  return {
    currency:    'GHS',
    countryCode: 'GH',
    countryName: 'Ghana',
    source:      'fallback',
  };
}

// ── Exchange rate ─────────────────────────────────────────────────────────────

interface ExchangeInfo {
  rate: number;          // 1 USD = rate × localCurrency
  source: 'live' | 'fallback';
  fetchedAt: number;
}

// Conservative static fallbacks (updated periodically in code)
const FALLBACK_RATES: Record<string, number> = {
  GHS: 15.5,
  NGN: 1620,
  KES: 130,
  ZAR: 18.5,
  UGX: 3780,
  TZS: 2600,
  XOF: 610,   // West African CFA (Senegal)
  ETB: 57,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
};

async function fetchExchangeRate(targetCurrency: string): Promise<ExchangeInfo> {
  if (targetCurrency === 'USD') {
    return { rate: 1, source: 'live', fetchedAt: Date.now() };
  }

  // open.er-api.com — free, no key, generous limits
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const d = await res.json();
      if (d.result === 'success' && d.rates?.[targetCurrency]) {
        return { rate: d.rates[targetCurrency], source: 'live', fetchedAt: Date.now() };
      }
    }
  } catch { /* fall through */ }

  // exchangerate.host fallback
  try {
    const res = await fetch(
      `https://api.exchangerate.host/convert?from=USD&to=${targetCurrency}&amount=1`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (res.ok) {
      const d = await res.json();
      if (d.success && d.result) {
        return { rate: d.result, source: 'live', fetchedAt: Date.now() };
      }
    }
  } catch { /* fall through */ }

  return {
    rate:      FALLBACK_RATES[targetCurrency] ?? 1,
    source:    'fallback',
    fetchedAt: Date.now(),
  };
}

// ── Minimum deposit: 300 GHS ──────────────────────────────────────────────────
//
//   Backend always validates in GHS. We display the USD equivalent in the UI,
//   derived from the live GHS rate so it stays accurate.
//
//   For NGN users we convert:  300 GHS → USD → NGN  (two-hop)
//   so the Paystack charge is always equivalent to 300 GHS.

const MIN_GHS = 300;

/**
 * Returns the minimum deposit expressed in USD.
 * Uses live GHS rate when available; falls back to hardcoded rate.
 */
function calcMinUsd(ghsRate: number | null): number {
  const rate = ghsRate ?? FALLBACK_RATES['GHS'];
  return Math.ceil((MIN_GHS / rate) * 100) / 100; // round up to nearest cent
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countryFlag(cc: string): string {
  if (!cc || cc.length !== 2) return '';
  return cc.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
  ).join('');
}

function fmtLocal(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function fmtUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return (
    <div className={`${h} ${w} rounded-lg animate-pulse`}
      style={{ backgroundColor: 'var(--border-light)' }} />
  );
}

function BtnPrimary({ children, onClick, disabled = false, className = '' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
      onMouseEnter={e => !disabled && ((e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.filter = '')}
    >
      {children}
    </button>
  );
}

function BtnSecondary({ children, onClick, className = '' }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${className}`}
      style={{
        backgroundColor: 'var(--card-alt)',
        border: '1px solid var(--border-light)',
        color: 'var(--text-main)',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.filter = 'brightness(0.96)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.filter = '')}
    >
      {children}
    </button>
  );
}

// ── Amount Input (USD) ────────────────────────────────────────────────────────

function AmountInput({ value, onChange, minUSD, isValid }: {
  value: string;
  onChange: (v: string) => void;
  minUSD: number;
  isValid: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = value !== '' && !isValid;

  const borderColor = hasError ? '#e11d48' : focused ? 'var(--primary)' : 'var(--border-light)';
  const shadowStyle = focused
    ? hasError
      ? '0 0 0 3px color-mix(in srgb, #e11d48 18%, transparent)'
      : '0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent)'
    : 'none';

  return (
    <div
      className="flex items-center rounded-xl overflow-hidden transition-all duration-200"
      style={{ border: `1.5px solid ${borderColor}`, boxShadow: shadowStyle, backgroundColor: 'var(--card-bg)' }}
    >
      <div
        className="flex items-center justify-center px-4 h-14 shrink-0 select-none"
        style={{
          backgroundColor: focused ? 'color-mix(in srgb, var(--primary) 8%, var(--card-alt))' : 'var(--card-alt)',
          borderRight: `1.5px solid ${borderColor}`,
          transition: 'background-color 0.2s, border-color 0.2s',
          minWidth: '64px',
        }}
      >
        <span className="text-base font-bold tracking-tight"
          style={{ color: focused ? 'var(--primary)' : 'var(--text-muted)' }}>
          $
        </span>
      </div>

      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={`Min ${fmtUsd(minUSD)}`}
        min={minUSD}
        step="0.01"
        className="flex-1 h-14 px-4 text-xl font-bold outline-none bg-transparent"
        style={{
          color: hasError ? '#e11d48' : 'var(--text-main)',
          caretColor: 'var(--primary)',
          MozAppearance: 'textfield',
        } as React.CSSProperties}
      />

      <div className="px-4 shrink-0 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
        USD
      </div>
    </div>
  );
}

// ── Conversion Preview Banner ─────────────────────────────────────────────────

function ConversionPreview({ usdAmount, exchange, localCurrency, loading }: {
  usdAmount: number;
  exchange: ExchangeInfo | null;
  localCurrency: string;
  loading: boolean;
}) {
  if (!usdAmount || usdAmount <= 0) return null;

  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--primary) 8%, var(--card-alt))',
        border: '1px solid color-mix(in srgb, var(--primary) 20%, var(--border-light))',
      }}
    >
      <SwapHorizIcon sx={{ fontSize: 14 }} style={{ color: 'var(--primary)', flexShrink: 0 }} />
      {loading ? (
        <SkeletonLine w="w-48" h="h-3" />
      ) : exchange ? (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="font-bold" style={{ color: 'var(--text-main)' }}>
            {fmtUsd(usdAmount)}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>≈</span>
          <span className="font-bold" style={{ color: 'var(--primary)' }}>
            {fmtLocal(usdAmount * exchange.rate, localCurrency)}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            (1 USD = {exchange.rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} {localCurrency}
            {exchange.source === 'fallback' ? ' · est.' : ' · live'})
          </span>
        </div>
      ) : null}
    </div>
  );
}

// ── Geo Banner ────────────────────────────────────────────────────────────────

function GeoBanner({ geoInfo, geoLoading, psConfig }: {
  geoInfo: GeoInfo | null;
  geoLoading: boolean;
  psConfig: PaystackConfig;
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
      style={{ backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-light)' }}
    >
      <PublicIcon sx={{ fontSize: 14 }} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      {geoLoading ? (
        <SkeletonLine w="w-56" h="h-3" />
      ) : geoInfo ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {geoInfo.countryCode && (
            <span className="text-base leading-none">{countryFlag(geoInfo.countryCode)}</span>
          )}
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Detected:</span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
            {geoInfo.countryName || geoInfo.countryCode}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
          <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
            Paystack charges in {psConfig.currency}
          </span>
          {geoInfo.source === 'fallback' && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(default)</span>
          )}
        </div>
      ) : (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Location unavailable</span>
      )}
    </div>
  );
}

// ── Quick-select amounts (USD) — always ≥ minUSD ──────────────────────────────

function buildQuickAmounts(minUsd: number): number[] {
  const base = Math.ceil(minUsd);
  const candidates = [base, 25, 50, 100, 200, 500];
  return Array.from(new Set(candidates.filter(v => v >= base)))
    .sort((a, b) => a - b)
    .slice(0, 6);
}

// ── Main DepositPage ──────────────────────────────────────────────────────────

export default function DepositPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAppStore();

  // ── geo + exchange state ──────────────────────────────────────────────────
  const [geoInfo,    setGeoInfo]    = useState<GeoInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  // We keep two separate exchange rates:
  //   ghsExchange  — always USD→GHS, used to calculate the minimum in USD
  //   psExchange   — USD→(Paystack currency), used for the charge conversion
  const [ghsExchange, setGhsExchange] = useState<ExchangeInfo | null>(null);
  const [psExchange,  setPsExchange]  = useState<ExchangeInfo | null>(null);
  const [exLoading,   setExLoading]   = useState(false);

  // ── form state ────────────────────────────────────────────────────────────
  const [amount,       setAmount]       = useState('');
  const [paystackRef,  setPaystackRef]  = useState('');
  const [step,         setStep]         = useState<Step>('form');
  const [loading,      setLoading]      = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) navigate('/login', { replace: true, state: { from: '/deposit' } });
  }, [currentUser, navigate]);

  // ── Step 1: detect country via IP ─────────────────────────────────────────
  useEffect(() => {
    setGeoLoading(true);
    fetchGeoInfo().then(geo => {
      setGeoInfo(geo);
      setGeoLoading(false);
    });
  }, []);

  // ── Step 2: fetch exchange rates once geo is known ────────────────────────
  useEffect(() => {
    if (!geoInfo) return;

    setExLoading(true);

    const psConfig = getPaystackConfig(geoInfo.countryCode);

    // Always fetch GHS rate (for minimum calculation)
    const ghsPromise = fetchExchangeRate('GHS');

    // Fetch Paystack currency rate (may be GHS again — that's fine)
    const psPromise  = psConfig.currency === 'GHS'
      ? ghsPromise          // reuse same request result
      : fetchExchangeRate(psConfig.currency);

    Promise.all([ghsPromise, psPromise])
      .then(([ghs, ps]) => {
        setGhsExchange(ghs);
        setPsExchange(ps);
      })
      .finally(() => setExLoading(false));
  }, [geoInfo?.countryCode]);

  // ── Fetch wallet balance ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !ghsExchange) return;
    walletApi.getWallet()
      .then(res => {
        const bal = (res.data as { balance?: number }).balance ?? null;
        if (bal !== null) {
          // wallet stored in GHS → display in USD
          setWalletBalance(bal / ghsExchange.rate);
        }
      })
      .catch(() => {});
  }, [currentUser, ghsExchange]);

  // ── Derived values ────────────────────────────────────────────────────────

  const psConfig  = getPaystackConfig(geoInfo?.countryCode ?? 'GH');

  // Minimum in USD based on 300 GHS live rate
  const minUSD    = calcMinUsd(ghsExchange?.rate ?? null);

  const parsedAmount = parseFloat(amount);
  const amountValid  = !isNaN(parsedAmount) && parsedAmount >= minUSD;

  // What Paystack will actually charge (in GHS or NGN depending on country)
  const psLocalAmount = psExchange
    ? Math.round(parsedAmount * psExchange.rate * 100) / 100
    : null;

  const quickAmounts = buildQuickAmounts(minUSD);

  const ratesReady = !geoLoading && !exLoading && !!ghsExchange && !!psExchange;

  // ── Paystack popup flow ───────────────────────────────────────────────────

  const handlePaystackDeposit = async () => {
    if (!amountValid || !psExchange || !ghsExchange) return;

    const popup = window.open('', 'paystack', 'width=600,height=700,scrollbars=yes');
    if (!popup || popup.closed) {
      setErrorMsg('Your browser blocked the payment popup. Please allow popups for this site and try again.');
      setStep('error');
      return;
    }

    popup.document.write(`
      <html><head><title>Redirecting to Paystack…</title>
      <style>
        body { margin:0; display:flex; align-items:center; justify-content:center;
               min-height:100vh; font-family:sans-serif; background:#0f172a; color:#94a3b8; }
        .spinner { width:40px; height:40px; border:3px solid #334155;
                   border-top-color:#3b82f6; border-radius:50%;
                   animation:spin 0.8s linear infinite; margin-bottom:16px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .wrap { text-align:center; }
      </style></head>
      <body><div class="wrap"><div class="spinner"></div><p>Connecting to Paystack…</p></div></body></html>
    `);

    setLoading(true);
    setErrorMsg('');
    setStep('processing');

    try {
      const res = await deposits.paystackInit({
        // Amount in Paystack's local currency (GHS or NGN)
        amount:       psLocalAmount,
        currency:     psConfig.currency,
        channel:      psConfig.channel,
        // Original USD amount + rates so the server can record correctly
        usdAmount:    parsedAmount,
        exchangeRate: psExchange.rate,
        ghsRate:      ghsExchange.rate,
        countryCode:  geoInfo?.countryCode ?? 'GH',
      });

      const raw     = res.data as Record<string, unknown>;
      const inner   = (raw?.data ?? raw) as Record<string, unknown>;
      const authUrl = (inner?.authorization_url ?? inner?.authorizationUrl ?? '') as string;
      const ref     = (inner?.reference ?? raw?.reference ?? '') as string;

      if (!authUrl) {
        popup.close();
        throw new Error('Paystack did not return a payment URL. Check server logs.');
      }

      setPaystackRef(ref);

      if (!popup.closed) {
        popup.location.href = authUrl;
        // Wait for user to finish / close popup
        await new Promise<void>(resolve => {
          const timer = setInterval(() => {
            if (popup.closed) { clearInterval(timer); resolve(); }
          }, 500);
        });
      } else {
        window.location.href = authUrl;
      }

      setStep('success');
    } catch (e: unknown) {
      popup?.close();
      setErrorMsg(
        e instanceof Error ? e.message : 'Deposit failed. Please check your connection and try again.'
      );
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep('form');
    setAmount('');
    setPaystackRef('');
    setErrorMsg('');
  };

  // ── Processing screen ─────────────────────────────────────────────────────

  if (step === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-alt)' }}>
        <div className="max-w-sm w-full mx-auto p-6 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-pulse"
            style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}
          >
            <AddCardIcon style={{ color: 'var(--primary)', fontSize: 32 }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>Processing…</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Please complete the payment in the popup window.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Do not close this page.</p>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-alt)' }}>
        <div className="max-w-sm w-full mx-auto p-6 text-center space-y-4">
          <CheckCircleIcon style={{ color: '#10b981', fontSize: 64 }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#10b981' }}>Payment Initiated</h2>
            <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text-main)' }}>
              {fmtUsd(parsedAmount)}
            </p>
            {psExchange && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                ≈ {fmtLocal(parsedAmount * psExchange.rate, psConfig.currency)} charged via Paystack
              </p>
            )}
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Your wallet will be credited in USD once the payment is confirmed.
            </p>
            {paystackRef && (
              <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-muted)' }}>
                Ref: {paystackRef}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <BtnPrimary onClick={() => navigate('/wallet')}>
              <AccountBalanceWalletIcon fontSize="small" />
              Go to Wallet
            </BtnPrimary>
            <BtnSecondary onClick={resetAll}>Make Another Deposit</BtnSecondary>
          </div>
        </div>
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────────────────────

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-alt)' }}>
        <div className="max-w-sm w-full mx-auto p-6 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'color-mix(in srgb, #f43f5e 12%, transparent)' }}
          >
            <span className="text-2xl font-bold" style={{ color: '#e11d48' }}>✕</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#e11d48' }}>Failed</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {errorMsg || 'Something went wrong. Please try again.'}
            </p>
          </div>
          <BtnPrimary onClick={resetAll}>Try Again</BtnPrimary>
        </div>
      </div>
    );
  }

  // ── Deposit form ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: 'var(--card-alt)' }}>
      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <AddCardIcon style={{ color: 'var(--primary)' }} />
            Deposit
          </h1>
          {walletBalance !== null && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 13 }} />
              <span style={{ color: 'var(--text-main)' }}>{fmtUsd(walletBalance)}</span>
            </div>
          )}
        </div>

        {/* Geo Banner — shows detected country + Paystack currency */}
        <GeoBanner geoInfo={geoInfo} geoLoading={geoLoading} psConfig={psConfig} />

        {/* Amount card */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
        >
          <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            Amount (USD)
          </label>

          <AmountInput
            value={amount}
            onChange={setAmount}
            minUSD={minUSD}
            isValid={amountValid}
          />

          {/* Min hint */}
          <div className="mt-1.5 space-y-1">
            {exLoading ? (
              <SkeletonLine w="w-56" h="h-3" />
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Minimum deposit: {fmtUsd(minUSD)} USD
                {ghsExchange?.source === 'live'
                  ? ` (= GHS ${MIN_GHS} at live rate)`
                  : ` (≈ GHS ${MIN_GHS} est.)`}
              </p>
            )}
            {amount && !amountValid && (
              <p className="text-xs" style={{ color: '#e11d48' }}>
                Minimum deposit is {fmtUsd(minUSD)} USD
              </p>
            )}
          </div>

          {/* Live conversion preview */}
          {amountValid && (
            <div className="mt-3">
              <ConversionPreview
                usdAmount={parsedAmount}
                exchange={psExchange}
                localCurrency={psConfig.currency}
                loading={exLoading}
              />
            </div>
          )}

          {/* Quick amounts */}
          <div className="grid grid-cols-6 gap-2 mt-3">
            {quickAmounts.map(qa => {
              const active = amount === qa.toString();
              return (
                <button
                  key={qa}
                  type="button"
                  onClick={() => setAmount(qa.toString())}
                  className="py-2 text-xs font-semibold rounded-lg transition-all active:scale-[0.95]"
                  style={{
                    backgroundColor: active ? 'var(--primary)' : 'var(--card-alt)',
                    color: active ? '#fff' : 'var(--text-main)',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border-light)'}`,
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)'; }}
                >
                  ${qa}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA button */}
        <BtnPrimary
          onClick={handlePaystackDeposit}
          disabled={!amountValid || loading || !ratesReady}
        >
          {geoLoading
            ? 'Detecting location…'
            : exLoading
              ? 'Loading exchange rates…'
              : !amount
                ? `Enter an amount (min ${fmtUsd(minUSD)})`
                : !amountValid
                  ? `Minimum is ${fmtUsd(minUSD)} USD`
                  : loading
                    ? 'Opening Paystack…'
                    : psLocalAmount
                      ? `Pay ${fmtLocal(psLocalAmount, psConfig.currency)} via Paystack`
                      : `Pay ${fmtUsd(parsedAmount)} via Paystack`}
        </BtnPrimary>

        {/* Footer note */}
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          🔒 You deposit in <strong>USD</strong> · Paystack charges in{' '}
          <strong>{psConfig.currency}</strong> at live rates · minimum GHS {MIN_GHS}
        </p>

      </div>
    </div>
  );
}