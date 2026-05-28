import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { wallet as walletApi } from '../utils/api';

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 'amount' | 'details' | 'awaiting' | 'success' | 'error';

const MIN_GHS       = 300;
const QUICK_AMOUNTS = [300, 500, 1000, 2000, 5000, 10000];
const TX_SUCCESS    = 1;
const TX_FAILED     = 2;
const API_BASE      = 'https://futballbackend-production-aefb.up.railway.app';

const NETWORKS = [
  { id: 'mtn',     label: 'MTN MoMo',   color: '#FFCC00' },
  { id: 'telecel', label: 'Telecel',     color: '#E2001A' },
  { id: 'at',      label: 'AirtelTigo', color: '#0072BC' },
];

// ── API helpers ────────────────────────────────────────────────────────────────

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function moolreCharge(
  amount: string, momoNumber: string, network: string, reference?: string
): Promise<{ externalref: string }> {
  const res = await fetch(`${API_BASE}/api/wallet/deposit/moolre/charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    credentials: 'include',
    body: JSON.stringify({ amount, momoNumber, network, reference }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  const inner = (json?.data ?? json) as Record<string, unknown>;
  const externalref = (inner?.externalref ?? inner?.externalRef ?? '') as string;
  if (!externalref) throw new Error('No transaction reference returned. Please try again.');
  return { externalref };
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
    credited: Boolean(inner?.credited),
    txstatus: Number(inner?.txstatus ?? -1),
    message:  String(inner?.message  ?? ''),
  };
}

// ── Formatters ─────────────────────────────────────────────────────────────────

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

// ── CSS ────────────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes popIn   { 0% { transform: scale(0.88); opacity: 0; } 60% { transform: scale(1.04); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes pulse   { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.75; transform:scale(1.06); } }
  @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }

  .deposit-root * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
  .deposit-root input[type=number]::-webkit-inner-spin-button,
  .deposit-root input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .deposit-root input[type=number] { -moz-appearance: textfield; }

  .deposit-root .btn-primary {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 15px 20px; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #1a56ff 0%, #0f3fd6 100%);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 0.01em;
    cursor: pointer; transition: opacity 0.15s, transform 0.12s;
    box-shadow: 0 4px 18px rgba(26,86,255,0.32);
  }
  .deposit-root .btn-primary:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.93; }
  .deposit-root .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .deposit-root .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .deposit-root .btn-ghost {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 13px 20px; border-radius: 14px;
    border: 1.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.45);
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .deposit-root .btn-ghost:hover { border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.65); }

  .deposit-root .card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; padding: 18px;
  }

  .deposit-root .field-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 10px;
  }

  .deposit-root .spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff;
    animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0;
  }

  .deposit-root .step-screen { animation: fadeUp 0.28s ease both; }

  .deposit-root .net-btn {
    padding: 14px 8px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03); cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    transition: all 0.15s; flex: 1;
  }
  .deposit-root .net-btn:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); }

  .deposit-root .quick-btn {
    padding: 8px 4px; border-radius: 10px;
    border: 1.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.12s; text-align: center;
  }
  .deposit-root .quick-btn:hover { border-color: rgba(26,86,255,0.4); color: #fff; }
  .deposit-root .quick-btn.active {
    border-color: #1a56ff; background: rgba(26,86,255,0.15); color: #fff;
  }

  .deposit-root .momo-input {
    width: 100%; height: 56px; padding: 0 16px;
    font-size: 20px; font-weight: 800; letter-spacing: 0.04em;
    background: transparent; border: none; outline: none; color: #fff;
    font-family: 'DM Mono', monospace;
  }

  .deposit-root .amount-input {
    flex: 1; height: 60px; padding: 0 16px;
    font-size: 28px; font-weight: 900;
    background: transparent; border: none; outline: none; color: #fff;
    font-family: 'DM Mono', monospace;
  }

  .deposit-root .amount-input::placeholder,
  .deposit-root .momo-input::placeholder { color: rgba(255,255,255,0.2); }

  .deposit-root .input-row {
    display: flex; align-items: center;
    border-radius: 12px; overflow: hidden;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    transition: border-color 0.15s;
  }
  .deposit-root .input-row:focus-within { border-color: rgba(26,86,255,0.5); }
  .deposit-root .input-row.error { border-color: rgba(239,68,68,0.5); }

  .deposit-root .input-prefix {
    padding: 0 14px; height: 56px; display: flex; align-items: center;
    border-right: 1px solid rgba(255,255,255,0.08);
    font-size: 11px; font-weight: 800; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.35); flex-shrink: 0;
  }

  .deposit-root .tip-box {
    padding: 12px 14px; border-radius: 12px;
    background: rgba(251,146,60,0.07); border: 1px solid rgba(251,146,60,0.18);
    display: flex; gap: 10px; align-items: flex-start;
    font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.65;
  }

  .deposit-root .err-box {
    padding: 11px 14px; border-radius: 12px;
    background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
    font-size: 12px; color: #f87171; line-height: 1.55;
  }

  .deposit-root .info-box {
    padding: 11px 14px; border-radius: 12px;
    background: rgba(26,86,255,0.07); border: 1px solid rgba(26,86,255,0.18);
    font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.55;
  }

  .deposit-root .back-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.4); font-size: 20px; padding: 0; line-height: 1;
    transition: color 0.15s;
  }
  .deposit-root .back-btn:hover { color: rgba(255,255,255,0.8); }

  .deposit-root .step-pills {
    display: flex; align-items: center; gap: 6px;
  }
  .deposit-root .step-pill {
    height: 3px; border-radius: 2px; transition: all 0.25s;
  }
`;

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepPills({ step }: { step: Step }) {
  const map: Record<Step, number> = { amount: 1, details: 2, awaiting: 3, success: 4, error: 4 };
  const current = map[step];
  return (
    <div className="step-pills">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="step-pill"
          style={{
            width: i === current ? 20 : 12,
            background: i <= current ? '#1a56ff' : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

// ── Page Shell ─────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="deposit-root"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0b0e1a 0%, #0d1325 60%, #0a0f20 100%)',
        color: '#fff',
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 16px 48px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────────

function Header({
  title, onBack, step, walletBalance,
}: {
  title: string; onBack?: () => void; step: Step; walletBalance: number | null;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && (
          <button className="back-btn" onClick={onBack}>←</button>
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em' }}>{title}</div>
          <StepPills step={step} />
        </div>
      </div>
      {walletBalance !== null && (
        <div style={{
          padding: '6px 12px', borderRadius: 100,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
        }}>
          💳 {fmtGHS(walletBalance)}
        </div>
      )}
    </div>
  );
}

// ── Spinner Button ─────────────────────────────────────────────────────────────

function PrimaryBtn({
  children, onClick, disabled = false, loading = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  disabled?: boolean; loading?: boolean;
}) {
  return (
    <button className="btn-primary" onClick={onClick} disabled={disabled || loading}>
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button className="btn-ghost" onClick={onClick}>{children}</button>
  );
}

// ── STEP 1: Amount ─────────────────────────────────────────────────────────────

function AmountStep({
  amount, setAmount, onContinue, walletBalance, step,
}: {
  amount: string; setAmount: (v: string) => void;
  onContinue: () => void; walletBalance: number | null; step: Step;
}) {
  const parsed     = parseFloat(amount);
  const amountValid = !isNaN(parsed) && parsed >= MIN_GHS;

  const ctaLabel = !amount
    ? `Enter amount (min ${fmtGHS(MIN_GHS)})`
    : !amountValid
      ? `Minimum is ${fmtGHS(MIN_GHS)}`
      : `Continue → ${fmtGHS(parsed)}`;

  return (
    <div className="step-screen" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <Header title="Deposit" step={step} walletBalance={walletBalance} />

      {/* Amount input */}
      <div className="card">
        <div className="field-label">Amount (GHS)</div>
        <div className={`input-row${amount && !amountValid ? ' error' : ''}`} style={{ height: 60 }}>
          <div className="input-prefix" style={{ height: 60, fontSize: 12, letterSpacing: '0.06em' }}>
            GHS
          </div>
          <input
            className="amount-input"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Min ${MIN_GHS}`}
            min={MIN_GHS}
          />
        </div>
        <div style={{
          fontSize: 11, marginTop: 6, fontWeight: 500,
          color: amount && !amountValid ? '#f87171' : 'rgba(255,255,255,0.3)',
        }}>
          {amount && !amountValid ? `Minimum deposit is ${fmtGHS(MIN_GHS)}` : `Min: ${fmtGHS(MIN_GHS)}`}
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginTop: 12 }}>
          {QUICK_AMOUNTS.map(qa => (
            <button
              key={qa}
              className={`quick-btn${amount === qa.toString() ? ' active' : ''}`}
              onClick={() => setAmount(qa.toString())}
            >
              {fmtQuick(qa)}
            </button>
          ))}
        </div>
      </div>

      {/* Networks supported */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '4px 0',
      }}>
        {NETWORKS.map(n => (
          <div key={n.id} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 100,
            background: `${n.color}14`, border: `1px solid ${n.color}44`,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: n.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: n.color }}>{n.label}</span>
          </div>
        ))}
      </div>

      <PrimaryBtn onClick={onContinue} disabled={!amountValid}>
        {ctaLabel}
      </PrimaryBtn>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
        🔒 Secured by Moolre
      </div>
    </div>
  );
}

// ── STEP 2: MoMo Details ───────────────────────────────────────────────────────

function DetailsStep({
  amount, onCharged, onBack, walletBalance, step,
}: {
  amount: number;
  onCharged: (ref: string) => void;
  onBack: () => void;
  walletBalance: number | null;
  step: Step;
}) {
  const [momoNumber, setMomoNumber] = useState('');
  const [network,    setNetwork]    = useState('');
  const [reference,  setReference]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const momoValid   = /^0[0-9]{9}$/.test(momoNumber);
  const canSubmit   = momoValid && network !== '' && !loading;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const { externalref } = await moolreCharge(
        amount.toString(), momoNumber, network, reference || undefined
      );
      localStorage.setItem('moolre_externalref', externalref);
      localStorage.setItem('moolre_amount',      amount.toString());
      onCharged(externalref);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-screen" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <Header title="Mobile Money" step={step} onBack={onBack} walletBalance={walletBalance} />

      {/* Amount badge */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="field-label">Depositing</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#1a56ff', letterSpacing: '-0.02em' }}>
              {fmtGHS(amount)}
            </div>
          </div>
          <div style={{
            padding: '6px 11px', borderRadius: 100,
            background: 'rgba(26,86,255,0.1)', border: '1px solid rgba(26,86,255,0.2)',
            fontSize: 11, fontWeight: 800, color: '#6b9aff',
          }}>
            🔒 Secured
          </div>
        </div>
      </div>

      {/* MoMo number */}
      <div className="card">
        <div className="field-label">Mobile Money Number</div>
        <div className={`input-row${momoNumber && !momoValid ? ' error' : ''}`}>
          <div className="input-prefix">🇬🇭 +233</div>
          <input
            className="momo-input"
            type="tel"
            value={momoNumber}
            onChange={e => setMomoNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="0XX XXX XXXX"
          />
        </div>
        {momoNumber && !momoValid && (
          <div style={{ fontSize: 11, marginTop: 6, color: '#f87171', fontWeight: 500 }}>
            Enter a valid 10-digit Ghana number (e.g. 0551234567)
          </div>
        )}
      </div>

      {/* Network */}
      <div className="card">
        <div className="field-label">Choose Network</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {NETWORKS.map(n => {
            const active = network === n.id;
            return (
              <button
                key={n.id}
                className="net-btn"
                onClick={() => setNetwork(n.id)}
                style={{
                  borderColor: active ? n.color : undefined,
                  background: active ? `${n.color}18` : undefined,
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: n.color,
                  boxShadow: active ? `0 0 8px ${n.color}` : 'none',
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  color: active ? n.color : 'rgba(255,255,255,0.4)',
                }}>
                  {n.label}
                </span>
                {active && (
                  <span style={{ fontSize: 9, color: n.color, fontWeight: 800 }}>✓ SELECTED</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reference (optional) */}
      <div className="card">
        <div className="field-label">Reference <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
        <div className="input-row">
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="e.g. Deposit for ZynoBet"
            style={{
              width: '100%', height: 46, padding: '0 14px',
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, fontWeight: 500, color: '#fff',
            }}
          />
        </div>
      </div>

      {/* Tip */}
      <div className="tip-box">
        <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
        <span>
          Tap <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Confirm</strong> and approve the MoMo PIN prompt on your phone.
          Then tap <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Check Payment</strong> to verify.
        </span>
      </div>

      {error && <div className="err-box">{error}</div>}

      <PrimaryBtn onClick={handleConfirm} disabled={!canSubmit} loading={loading}>
        Confirm · {fmtGHS(amount)}
      </PrimaryBtn>

      <GhostBtn onClick={onBack}>← Change Amount</GhostBtn>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
        🔒 Secured by Moolre · MTN · Telecel · AirtelTigo
      </div>
    </div>
  );
}

// ── STEP 3: Awaiting ───────────────────────────────────────────────────────────

function AwaitingStep({
  amount, verifyMsg, verifyLoading, onVerify, onCancel,
}: {
  amount: number; verifyMsg: string; verifyLoading: boolean;
  onVerify: () => void; onCancel: () => void;
}) {
  return (
    <div
      className="step-screen"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        maxWidth: 400, width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: '32px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        animation: 'popIn 0.35s ease both',
      }}>
        {/* Pulse icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(26,86,255,0.12)',
          border: '2px solid rgba(26,86,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 2.2s ease-in-out infinite',
          fontSize: 28,
        }}>
          📲
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
            Awaiting Approval
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1a56ff', letterSpacing: '-0.02em' }}>
            {fmtGHS(amount)}
          </div>
        </div>

        <div className="tip-box" style={{ width: '100%' }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
          <span>
            A MoMo PIN prompt has been sent to your phone.
            Approve it, then tap <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Check Payment</strong> below.
          </span>
        </div>

        {verifyMsg && (
          <div className="info-box" style={{ width: '100%' }}>{verifyMsg}</div>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PrimaryBtn onClick={onVerify} loading={verifyLoading}>
            🔄 Check Payment
          </PrimaryBtn>
          <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ── STEP 4a: Success ───────────────────────────────────────────────────────────

function SuccessStep({
  amount, externalRef, onWallet, onAgain,
}: {
  amount: number; externalRef: string; onWallet: () => void; onAgain: () => void;
}) {
  return (
    <div
      className="step-screen"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        maxWidth: 400, width: '100%',
        background: 'rgba(16,185,129,0.04)',
        border: '1px solid rgba(16,185,129,0.18)',
        borderRadius: 24, padding: '32px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        animation: 'popIn 0.35s ease both',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(16,185,129,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        }}>
          ✅
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>
            Deposit Confirmed
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
            {fmtGHS(amount)}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            Your wallet has been credited.
          </div>
          {externalRef && (
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Mono, monospace',
              marginTop: 10, wordBreak: 'break-all',
            }}>
              Ref: {externalRef}
            </div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PrimaryBtn onClick={onWallet}>💳 Go to Wallet</PrimaryBtn>
          <GhostBtn onClick={onAgain}>Make Another Deposit</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ── STEP 4b: Error ─────────────────────────────────────────────────────────────

function ErrorStep({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div
      className="step-screen"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        maxWidth: 400, width: '100%',
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.18)',
        borderRadius: 24, padding: '32px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        animation: 'popIn 0.35s ease both',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>
          ✕
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>
            Payment Failed
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {msg || 'Something went wrong. Please try again.'}
          </div>
        </div>
        <PrimaryBtn onClick={onRetry}>Try Again</PrimaryBtn>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DepositPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAppStore();

  const [step,          setStep]          = useState<Step>('amount');
  const [amount,        setAmount]        = useState('');
  const [externalRef,   setExternalRef]   = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');
  const [verifyMsg,     setVerifyMsg]     = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Auth guard
  useEffect(() => {
    if (!currentUser) navigate('/login', { replace: true, state: { from: '/deposit' } });
  }, [currentUser, navigate]);

  // Load wallet balance
  useEffect(() => {
    if (!currentUser) return;
    walletApi.getWallet()
      .then(res => {
        const bal = (res.data as { balance?: number }).balance ?? null;
        if (bal !== null) setWalletBalance(bal);
      })
      .catch(() => {});
  }, [currentUser]);

  // Resume in-progress payment on page reload
  useEffect(() => {
    const savedRef    = localStorage.getItem('moolre_externalref');
    const savedAmount = localStorage.getItem('moolre_amount');
    if (savedRef && savedAmount) {
      setExternalRef(savedRef);
      setAmount(savedAmount);
      setStep('awaiting');
    }
  }, []);

  const parsedAmount = parseFloat(amount);

  // Verify MoMo payment
  const handleVerify = async () => {
    if (!externalRef) return;
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      const { credited, txstatus, message } = await moolreVerify(externalRef);
      if (credited || txstatus === TX_SUCCESS) {
        localStorage.removeItem('moolre_externalref');
        localStorage.removeItem('moolre_amount');
        setStep('success');
      } else if (txstatus === TX_FAILED) {
        localStorage.removeItem('moolre_externalref');
        localStorage.removeItem('moolre_amount');
        setErrorMsg('Payment failed or was cancelled.');
        setStep('error');
      } else {
        setVerifyMsg(message || 'Payment still pending. Please approve the MoMo prompt on your phone, then tap Check Payment.');
      }
    } catch (e: unknown) {
      setVerifyMsg(e instanceof Error ? e.message : 'Could not verify. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const resetAll = () => {
    localStorage.removeItem('moolre_externalref');
    localStorage.removeItem('moolre_amount');
    setStep('amount'); setAmount(''); setExternalRef('');
    setErrorMsg(''); setVerifyMsg('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Shell>
      {step === 'amount' && (
        <AmountStep
          amount={amount}
          setAmount={setAmount}
          onContinue={() => setStep('details')}
          walletBalance={walletBalance}
          step={step}
        />
      )}

      {step === 'details' && (
        <DetailsStep
          amount={parsedAmount}
          onCharged={(ref) => { setExternalRef(ref); setStep('awaiting'); }}
          onBack={() => setStep('amount')}
          walletBalance={walletBalance}
          step={step}
        />
      )}

      {step === 'awaiting' && (
        <AwaitingStep
          amount={parsedAmount || parseFloat(localStorage.getItem('moolre_amount') ?? '0')}
          verifyMsg={verifyMsg}
          verifyLoading={verifyLoading}
          onVerify={handleVerify}
          onCancel={resetAll}
        />
      )}

      {step === 'success' && (
        <SuccessStep
          amount={parsedAmount}
          externalRef={externalRef}
          onWallet={() => navigate('/wallet')}
          onAgain={resetAll}
        />
      )}

      {step === 'error' && (
        <ErrorStep msg={errorMsg} onRetry={resetAll} />
      )}
    </Shell>
  );
}
