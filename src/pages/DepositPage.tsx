import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { useAppStore } from '../store';
import { deposits, wallet as walletApi } from '../utils/api';
import AddCardIcon from '@mui/icons-material/AddCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// ── Geo / IP detection ────────────────────────────────────────────────────────

interface GeoInfo {
  currency: string;
  countryCode: string;
  source: 'ip-api' | 'fallback';
}

async function fetchGeoInfo(): Promise<GeoInfo> {
  try {
    const res = await fetch('/api/geo/currency');
    if (!res.ok) throw new Error('geo fetch failed');
    return (await res.json()) as GeoInfo;
  } catch {
    return { currency: 'GHS', countryCode: 'GH', source: 'fallback' };
  }
}

function countryFlag(countryCode: string): string {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

// ── Country config ────────────────────────────────────────────────────────────

interface CountryConfig {
  minAmount: number;
  currency: string;
  currencySymbol: string;
  quickAmounts: number[];
  channel: string;
}

function getCountryConfig(countryCode: string): CountryConfig {
  switch (countryCode.toUpperCase()) {
    case 'NG':
      return {
        minAmount: 10,
        currency: 'NGN',
        currencySymbol: '₦',
        quickAmounts: [500, 1000, 2000, 5000, 10000],
        channel: 'mobile_money',
      };
    case 'GH':
    default:
      return {
        minAmount: 10,
        currency: 'GHS',
        currencySymbol: 'GH₵',
        quickAmounts: [10, 50, 100, 200, 500],
        channel: 'mobile_money',
      };
  }
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return (
    <div
      className={`${h} ${w} rounded-lg animate-pulse`}
      style={{ backgroundColor: 'var(--border-light)' }}
    />
  );
}

function BtnPrimary({
  children, onClick, disabled = false, className = '',
}: {
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
      onMouseEnter={e =>
        !disabled && ((e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)')
      }
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.filter = '')}
    >
      {children}
    </button>
  );
}

function BtnSecondary({
  children, onClick, className = '',
}: {
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
      onMouseEnter={e =>
        ((e.currentTarget as HTMLElement).style.filter = 'brightness(0.96)')
      }
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.filter = '')}
    >
      {children}
    </button>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'form' | 'processing' | 'success' | 'error';

// ── Geo Banner component ──────────────────────────────────────────────────────

function GeoBanner({
  geoInfo,
  geoLoading,
  config,
}: {
  geoInfo: GeoInfo | null;
  geoLoading: boolean;
  config: CountryConfig;
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
      style={{
        backgroundColor: 'var(--card-alt)',
        border: '1px solid var(--border-light)',
      }}
    >
      <PublicIcon sx={{ fontSize: 14 }} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      {geoLoading ? (
        <SkeletonLine w="w-48" h="h-3" />
      ) : geoInfo ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {geoInfo.countryCode && (
            <span className="text-base leading-none">{countryFlag(geoInfo.countryCode)}</span>
          )}
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Detected:
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
            {geoInfo.countryCode || '—'} · {geoInfo.currency}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            — min deposit:
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
            {config.currencySymbol}{config.minAmount}
          </span>
          {geoInfo.source === 'fallback' && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(default)</span>
          )}
        </div>
      ) : (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Location unavailable
        </span>
      )}
    </div>
  );
}

// ── Styled Amount Input ───────────────────────────────────────────────────────

function AmountInput({
  value,
  onChange,
  currencySymbol,
  minAmount,
  isValid,
}: {
  value: string;
  onChange: (val: string) => void;
  currencySymbol: string;
  minAmount: number;
  isValid: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = value !== '' && !isValid;

  const borderColor = hasError
    ? '#e11d48'
    : focused
    ? 'var(--primary)'
    : 'var(--border-light)';

  const shadowStyle = focused
    ? hasError
      ? '0 0 0 3px color-mix(in srgb, #e11d48 18%, transparent)'
      : '0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent)'
    : 'none';

  return (
    <div
      className="flex items-center rounded-xl overflow-hidden transition-all duration-200"
      style={{
        border: `1.5px solid ${borderColor}`,
        boxShadow: shadowStyle,
        backgroundColor: 'var(--card-bg)',
      }}
    >
      {/* Currency prefix */}
      <div
        className="flex items-center justify-center px-4 h-14 shrink-0 select-none"
        style={{
          backgroundColor: focused
            ? 'color-mix(in srgb, var(--primary) 8%, var(--card-alt))'
            : 'var(--card-alt)',
          borderRight: `1.5px solid ${borderColor}`,
          transition: 'background-color 0.2s, border-color 0.2s',
          minWidth: '64px',
        }}
      >
        <span
          className="text-base font-bold tracking-tight"
          style={{ color: focused ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          {currencySymbol}
        </span>
      </div>

      {/* Number input */}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={`Min ${minAmount.toLocaleString()}`}
        min={minAmount}
        step="1"
        className="flex-1 h-14 px-4 text-xl font-bold outline-none bg-transparent"
        style={{
          color: hasError ? '#e11d48' : 'var(--text-main)',
          caretColor: 'var(--primary)',
          /* Remove number input arrows */
          MozAppearance: 'textfield',
        } as React.CSSProperties}
      />

      {/* Live formatted preview */}
      {value && isValid && (
        <div
          className="px-4 shrink-0 text-xs font-semibold"
          style={{ color: 'var(--text-muted)' }}
        >
          {parseFloat(value).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ── Main DepositPage ──────────────────────────────────────────────────────────

export default function DepositPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAppStore();

  const [geoInfo, setGeoInfo]             = useState<GeoInfo | null>(null);
  const [geoLoading, setGeoLoading]       = useState(true);
  const [amount, setAmount]               = useState('');
  const [paystackRef, setPaystackRef]     = useState('');
  const [step, setStep]                   = useState<Step>('form');
  const [loading, setLoading]             = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) navigate('/login', { replace: true, state: { from: '/deposit' } });
  }, [currentUser, navigate]);

  useEffect(() => {
    setGeoLoading(true);
    fetchGeoInfo().then(setGeoInfo).finally(() => setGeoLoading(false));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    walletApi.getWallet()
      .then(res => setWalletBalance((res.data as { balance?: number }).balance ?? null))
      .catch(() => {});
  }, [currentUser]);

  const config       = getCountryConfig(geoInfo?.countryCode ?? 'GH');
  const parsedAmount = parseFloat(amount);
  const amountValid  = !isNaN(parsedAmount) && parsedAmount >= config.minAmount;

  const handlePaystackDeposit = async () => {
    if (!amountValid) return;

    const popup = window.open('', 'paystack', 'width=600,height=700,scrollbars=yes');

    if (!popup || popup.closed) {
      setErrorMsg(
        'Your browser blocked the payment popup. Please allow popups for this site and try again.'
      );
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

    setLoading(true); setErrorMsg(''); setStep('processing');

    try {
      const res = await deposits.paystackInit({
        amount: parsedAmount,
        currency: config.currency,
        channel: config.channel,
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
        await new Promise<void>((resolve) => {
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
    setStep('form'); setAmount(''); setPaystackRef(''); setErrorMsg('');
  };

  // ── Processing ────────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--card-alt)' }}
      >
        <div className="max-w-sm w-full mx-auto p-6 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-pulse"
            style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}
          >
            <AddCardIcon style={{ color: 'var(--primary)', fontSize: 32 }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
            Processing…
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Please complete the payment in the popup window.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Do not close this page.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--card-alt)' }}
      >
        <div className="max-w-sm w-full mx-auto p-6 text-center space-y-4">
          <CheckCircleIcon style={{ color: '#10b981', fontSize: 64 }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#10b981' }}>
              Payment Initiated
            </h2>
            <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text-main)' }}>
              {formatCurrency(parsedAmount)}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Your wallet will be credited once the payment is confirmed.
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
            <BtnSecondary onClick={resetAll}>
              Make Another Deposit
            </BtnSecondary>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--card-alt)' }}
      >
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
    <div
      className="min-h-screen pb-10"
      style={{ backgroundColor: 'var(--card-alt)' }}
    >
      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--text-main)' }}
          >
            <AddCardIcon style={{ color: 'var(--primary)' }} />
            Deposit
          </h1>
          {walletBalance !== null && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-muted)',
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 13 }} />
              <span style={{ color: 'var(--text-main)' }}>
                {formatCurrency(walletBalance)}
              </span>
            </div>
          )}
        </div>

        {/* Geo Banner */}
        <GeoBanner geoInfo={geoInfo} geoLoading={geoLoading} config={config} />

        {/* Amount card */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
        >
          <label
            className="block text-xs font-semibold mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Amount ({config.currencySymbol})
          </label>

          {/* Styled amount input */}
          <AmountInput
            value={amount}
            onChange={setAmount}
            currencySymbol={config.currencySymbol}
            minAmount={config.minAmount}
            isValid={amountValid}
          />

          {/* Validation hint */}
          <div className="h-5 mt-1.5">
            {amount && !amountValid && (
              <p className="text-xs" style={{ color: '#e11d48' }}>
                Minimum deposit is {config.currencySymbol}{config.minAmount}
              </p>
            )}
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-5 gap-2 mt-1">
            {(geoLoading ? [10, 50, 100, 200, 500] : config.quickAmounts).map(qa => {
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
                  onMouseEnter={e => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)';
                  }}
                >
                  {qa >= 1000 ? `${qa / 1000}k` : qa}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <BtnPrimary
          onClick={handlePaystackDeposit}
          disabled={!amountValid || loading || geoLoading}
        >
          {geoLoading
            ? 'Detecting location…'
            : !amount
              ? `Enter an amount (min ${config.currencySymbol}${config.minAmount})`
              : !amountValid
                ? `Minimum is ${config.currencySymbol}${config.minAmount}`
                : loading
                  ? 'Opening Paystack…'
                  : `Pay ${config.currencySymbol}${parsedAmount.toLocaleString()} via Paystack`}
        </BtnPrimary>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          🔒 Payments secured by Paystack
        </p>
      </div>
    </div>
  );
}