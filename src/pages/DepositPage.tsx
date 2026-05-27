import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { wallet as walletApi } from '../utils/api';
import AddCardIcon from '@mui/icons-material/AddCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'form' | 'awaiting' | 'success' | 'error';

const MIN_GHS = 300;
const QUICK_AMOUNTS = [300, 500, 1000, 2000, 5000, 10000];

const TX_SUCCESS   = 1;
const TX_FAILED    = 2;
const TX_NOT_FOUND = 3;

const API_BASE = 'https://futballbackend-production-aefb.up.railway.app';

// ── API helpers ───────────────────────────────────────────────────────────────

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function moolreInit(amount: string): Promise<{ authorizationUrl: string; externalref: string }> {
  const res = await fetch(`${API_BASE}/api/wallet/deposit/moolre/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    credentials: 'include',
    body: JSON.stringify({ amount }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);

  // Unwrap ApiResponse envelope if present
  const inner = (json?.data ?? json) as Record<string, unknown>;
  const authorizationUrl = (inner?.authorizationUrl ?? '') as string;
  const externalref      = (inner?.externalref      ?? '') as string;

  if (!authorizationUrl) throw new Error('No payment URL returned. Please try again.');
  return { authorizationUrl, externalref };
}

async function moolreVerify(externalref: string): Promise<{
  credited: boolean; txstatus: number; message: string;
}> {
  const res = await fetch(`${API_BASE}/api/wallet/deposit/moolre/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    credentials: 'include',
    body: JSON.stringify({ externalref }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);

  const inner = (json?.data ?? json) as Record<string, unknown>;
  return {
    credited:  Boolean(inner?.credited),
    txstatus:  Number(inner?.txstatus ?? -1),
    message:   String(inner?.message  ?? ''),
  };
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtGHS(n: number): string {
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency', currency: 'GHS', maximumFractionDigits: 2,
    }).format(n);
  } catch { return `GHS ${n.toFixed(2)}`; }
}

function fmtQuick(n: number): string {
  return n >= 1000 ? `${n / 1000}k` : String(n);
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function PrimaryBtn({
  children, onClick, disabled = false, loading = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  disabled?: boolean; loading?: boolean;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled || loading}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8, padding: '14px 16px',
        borderRadius: 12, border: 'none',
        backgroundColor: 'var(--primary)', color: '#fff',
        fontSize: 14, fontWeight: 700, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1, transition: 'opacity 0.15s',
      }}
    >
      {loading
        ? <span style={{ width: 17, height: 17, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
        : children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 6, padding: '12px 16px',
        borderRadius: 12, border: '1px solid var(--border-light)',
        backgroundColor: 'transparent', color: 'var(--text-muted)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border-light)',
      borderRadius: 16, padding: '14px 14px 16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
      textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: 'var(--card-alt)', padding: 16,
    }}>
      <div style={{
        maxWidth: 400, width: '100%',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-light)',
        borderRadius: 20, padding: '28px 22px',
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', gap: 18,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>
        {children}
      </div>
    </div>
  );
}

function IconCircle({ color, children, pulse = false }: {
  color: string; children: React.ReactNode; pulse?: boolean;
}) {
  return (
    <div style={{
      width: 60, height: 60, borderRadius: '50%', backgroundColor: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      animation: pulse ? 'pulse 2s ease-in-out infinite' : undefined,
    }}>
      {children}
    </div>
  );
}

// ── Awaiting Screen ───────────────────────────────────────────────────────────
// Shown after the user has been redirected to Moolre's POS page and has come back.

function AwaitingScreen({
  amount, verifyMsg, verifyLoading, onVerify, onOpenAgain, authorizationUrl, onCancel,
}: {
  amount: number;
  verifyMsg: string; verifyLoading: boolean;
  onVerify: () => void;
  onOpenAgain: () => void;
  authorizationUrl: string;
  onCancel: () => void;
}) {
  return (
    <CenteredCard>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.7; transform:scale(1.05) } }
      `}</style>

      <IconCircle color="rgba(var(--primary-rgb,59,130,246),0.10)" pulse>
        <RefreshIcon style={{ color: 'var(--primary)', fontSize: 28 }} />
      </IconCircle>

      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
          Complete your payment
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>
          {fmtGHS(amount)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          You should have been taken to the Moolre payment page.
          Complete the payment there, then come back and tap{' '}
          <strong style={{ color: 'var(--text-main)' }}>Check Payment</strong>.
        </div>
      </div>

      {/* Info box */}
      <div style={{
        width: '100%', padding: '12px 14px', borderRadius: 12,
        backgroundColor: 'rgba(251,146,60,0.07)',
        border: '1px solid rgba(251,146,60,0.22)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          On the Moolre page, enter your MoMo number, pick your network (MTN / Telecel / AT),
          and approve the prompt on your phone. Then return here and tap{' '}
          <strong style={{ color: 'var(--text-main)' }}>Check Payment</strong>.
        </div>
      </div>

      {verifyMsg && (
        <div style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          backgroundColor: 'rgba(var(--primary-rgb,59,130,246),0.06)',
          border: '1px solid rgba(var(--primary-rgb,59,130,246),0.15)',
          color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5,
        }}>
          {verifyMsg}
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PrimaryBtn onClick={onVerify} loading={verifyLoading}>
          <RefreshIcon fontSize="small" /> Check Payment
        </PrimaryBtn>

        {/* Let user re-open Moolre page if they accidentally closed it */}
        <button
          type="button"
          onClick={onOpenAgain}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, padding: '12px 16px',
            borderRadius: 12, border: '1px solid var(--border-light)',
            backgroundColor: 'transparent', color: 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <OpenInNewIcon fontSize="small" /> Open Payment Page Again
        </button>

        <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
      </div>
    </CenteredCard>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({
  amount, externalRef, onWallet, onAgain,
}: {
  amount: number; externalRef: string; onWallet: () => void; onAgain: () => void;
}) {
  return (
    <CenteredCard>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <IconCircle color="rgba(16,185,129,0.10)">
        <CheckCircleIcon style={{ color: '#10b981', fontSize: 32 }} />
      </IconCircle>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginBottom: 4 }}>
          Deposit Confirmed
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 }}>
          {fmtGHS(amount)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Your wallet has been credited successfully.
        </div>
        {externalRef && (
          <div style={{
            fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace',
            marginTop: 8, opacity: 0.55, wordBreak: 'break-all' as const,
          }}>
            Ref: {externalRef}
          </div>
        )}
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PrimaryBtn onClick={onWallet}>
          <AccountBalanceWalletIcon fontSize="small" /> Go to Wallet
        </PrimaryBtn>
        <GhostBtn onClick={onAgain}>Make Another Deposit</GhostBtn>
      </div>
    </CenteredCard>
  );
}

// ── Error Screen ──────────────────────────────────────────────────────────────

function ErrorScreen({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <CenteredCard>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <IconCircle color="rgba(239,68,68,0.08)">
        <span style={{ fontSize: 26, fontWeight: 900, color: '#ef4444' }}>✕</span>
      </IconCircle>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444', marginBottom: 6 }}>
          Payment Failed
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {msg || 'Something went wrong. Please try again.'}
        </div>
      </div>
      <PrimaryBtn onClick={onRetry}>Try Again</PrimaryBtn>
    </CenteredCard>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DepositPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAppStore();

  const [amount,        setAmount]        = useState('');
  const [step,          setStep]          = useState<Step>('form');
  const [loading,       setLoading]       = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');
  const [externalRef,   setExternalRef]   = useState('');
  const [authUrl,       setAuthUrl]       = useState('');
  const [verifyMsg,     setVerifyMsg]     = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) navigate('/login', { replace: true, state: { from: '/deposit' } });
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    walletApi.getWallet()
      .then(res => {
        const bal = (res.data as { balance?: number }).balance ?? null;
        if (bal !== null) setWalletBalance(bal);
      })
      .catch(() => {});
  }, [currentUser]);

  // ── On return from Moolre: auto-verify if externalref is in localStorage ──
  // When Moolre redirects the user back to this page, pick up the ref and
  // jump straight to the awaiting screen so they can tap Check Payment.
  useEffect(() => {
    const savedRef    = localStorage.getItem('moolre_externalref');
    const savedAmount = localStorage.getItem('moolre_amount');
    const savedUrl    = localStorage.getItem('moolre_authurl');
    if (savedRef && savedAmount && savedUrl) {
      setExternalRef(savedRef);
      setAmount(savedAmount);
      setAuthUrl(savedUrl);
      setStep('awaiting');
    }
  }, []);

  const parsedAmount = parseFloat(amount);
  const amountValid  = !isNaN(parsedAmount) && parsedAmount >= MIN_GHS;

  // ── Init: call backend → get Moolre POS URL → redirect user ──────────────

  const handleInit = async () => {
    if (!amountValid) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { authorizationUrl, externalref } = await moolreInit(parsedAmount.toString());

      // Persist so we can recover the ref when Moolre redirects back
      localStorage.setItem('moolre_externalref', externalref);
      localStorage.setItem('moolre_amount',      parsedAmount.toString());
      localStorage.setItem('moolre_authurl',     authorizationUrl);

      setExternalRef(externalref);
      setAuthUrl(authorizationUrl);

      // Redirect to Moolre's hosted POS page
      window.location.href = authorizationUrl;
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to create payment. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify: call backend status check ─────────────────────────────────────

  const handleVerify = async () => {
    if (!externalRef) return;
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      const { credited, txstatus, message } = await moolreVerify(externalRef);

      if (credited || txstatus === TX_SUCCESS) {
        // Clean up localStorage — payment is done
        localStorage.removeItem('moolre_externalref');
        localStorage.removeItem('moolre_amount');
        localStorage.removeItem('moolre_authurl');
        setStep('success');
      } else if (txstatus === TX_FAILED) {
        localStorage.removeItem('moolre_externalref');
        localStorage.removeItem('moolre_amount');
        localStorage.removeItem('moolre_authurl');
        setErrorMsg('Payment failed or was cancelled.');
        setStep('error');
      } else if (txstatus === TX_NOT_FOUND) {
        setVerifyMsg('Payment not found yet. Please complete payment on the Moolre page first, then tap Check Payment.');
      } else {
        setVerifyMsg(message || 'Payment is still pending. Please complete payment on the Moolre page, then tap Check Payment.');
      }
    } catch (e: unknown) {
      setVerifyMsg(e instanceof Error ? e.message : 'Could not verify payment. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const resetAll = () => {
    localStorage.removeItem('moolre_externalref');
    localStorage.removeItem('moolre_amount');
    localStorage.removeItem('moolre_authurl');
    setStep('form'); setAmount(''); setExternalRef('');
    setAuthUrl(''); setErrorMsg(''); setVerifyMsg('');
  };

  // ── Sub-screens ───────────────────────────────────────────────────────────

  if (step === 'awaiting') return (
    <AwaitingScreen
      amount={parsedAmount || parseFloat(localStorage.getItem('moolre_amount') ?? '0')}
      verifyMsg={verifyMsg} verifyLoading={verifyLoading}
      onVerify={handleVerify}
      onOpenAgain={() => { if (authUrl) window.open(authUrl, '_blank'); }}
      authorizationUrl={authUrl}
      onCancel={resetAll}
    />
  );

  if (step === 'success') return (
    <SuccessScreen
      amount={parsedAmount} externalRef={externalRef}
      onWallet={() => navigate('/wallet')} onAgain={resetAll}
    />
  );

  if (step === 'error') return (
    <ErrorScreen msg={errorMsg} onRetry={resetAll} />
  );

  // ── Form ──────────────────────────────────────────────────────────────────

  const ctaLabel = !amount
    ? `Enter amount (min ${fmtGHS(MIN_GHS)})`
    : !amountValid
      ? `Minimum is ${fmtGHS(MIN_GHS)}`
      : `Pay ${fmtGHS(parsedAmount)} via Moolre`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--card-alt)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 14px 40px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0 10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AddCardIcon style={{ color: 'var(--primary)', fontSize: 22 }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              Deposit
            </span>
          </div>
          {walletBalance !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 100,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 12, color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>
                {fmtGHS(walletBalance)}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* ── How it works ── */}
          <Card style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '1️⃣', text: 'Enter the amount you want to deposit.' },
                { icon: '2️⃣', text: "Tap Pay — you'll be taken to Moolre's secure payment page." },
                { icon: '3️⃣', text: 'Enter your MoMo number, pick your network, and approve.' },
                { icon: '4️⃣', text: "Return here and tap Check Payment to confirm your balance." },
              ].map(({ icon, text }) => (
                <div key={icon} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Amount ── */}
          <Card>
            <FieldLabel>Amount (GHS)</FieldLabel>
            <div style={{
              display: 'flex', alignItems: 'center',
              borderRadius: 10, overflow: 'hidden',
              border: `1.5px solid ${amount && !amountValid ? '#ef4444' : 'var(--border-light)'}`,
              backgroundColor: 'var(--card-alt)',
            }}>
              <div style={{
                padding: '0 12px', height: 54,
                display: 'flex', alignItems: 'center',
                borderRight: '1.5px solid var(--border-light)',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                color: 'var(--text-muted)', flexShrink: 0,
              }}>
                GHS
              </div>
              <input
                type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Min ${MIN_GHS}`}
                min={MIN_GHS}
                style={{
                  flex: 1, height: 54, padding: '0 12px',
                  fontSize: 24, fontWeight: 800,
                  background: 'transparent', border: 'none', outline: 'none',
                  color: amount && !amountValid ? '#ef4444' : 'var(--text-main)',
                } as React.CSSProperties}
              />
            </div>
            <div style={{
              fontSize: 11, marginTop: 5, fontWeight: 500,
              color: amount && !amountValid ? '#ef4444' : 'var(--text-muted)',
            }}>
              {amount && !amountValid
                ? `Minimum deposit is ${fmtGHS(MIN_GHS)}`
                : `Minimum: ${fmtGHS(MIN_GHS)}`}
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginTop: 10 }}>
              {QUICK_AMOUNTS.map(qa => {
                const active = amount === qa.toString();
                return (
                  <button
                    key={qa} type="button" onClick={() => setAmount(qa.toString())}
                    style={{
                      padding: '7px 2px', borderRadius: 8,
                      border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border-light)'}`,
                      backgroundColor: active ? 'var(--primary)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-main)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                  >
                    {fmtQuick(qa)}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ── Provider badges ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {[
              { short: 'MTN', color: '#FFCC00', bg: 'rgba(255,204,0,0.10)' },
              { short: 'Telecel', color: '#E2001A', bg: 'rgba(226,0,26,0.08)' },
              { short: 'AT', color: '#0072BC', bg: 'rgba(0,114,188,0.10)' },
            ].map(({ short, color, bg }) => (
              <div key={short} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 100,
                backgroundColor: bg, border: `1px solid ${color}44`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{short}</span>
              </div>
            ))}
          </div>

          {/* ── CTA ── */}
          <PrimaryBtn
            onClick={handleInit}
            disabled={!amountValid}
            loading={loading}
          >
            {loading ? null : (
              <>
                <OpenInNewIcon fontSize="small" />
                {ctaLabel}
              </>
            )}
          </PrimaryBtn>

          {/* ── Footer ── */}
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>
            🔒 Secured by Moolre · MTN · Telecel · AT · Min GHS {MIN_GHS}
          </div>

        </div>
      </div>
    </div>
  );
}
