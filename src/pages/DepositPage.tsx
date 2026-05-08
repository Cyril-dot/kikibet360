import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { useAppStore } from '../store';
import { deposits, wallet as walletApi } from '../utils/api';
import AddCardIcon from '@mui/icons-material/AddCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_AMOUNT    = 350;
const QUICK_AMOUNTS = [350, 500, 1000, 2000, 5000];

type Step = 'form' | 'processing' | 'success' | 'error';

// ── Helpers ───────────────────────────────────────────────────────────────────

function openPaystackPopup(authUrl: string): Promise<void> {
  return new Promise((resolve) => {
    const popup = window.open(authUrl, 'paystack', 'width=600,height=700,scrollbars=yes');
    if (!popup) {
      window.location.href = authUrl;
      resolve();
      return;
    }
    const timer = setInterval(() => {
      if (popup.closed) { clearInterval(timer); resolve(); }
    }, 500);
  });
}

// ── Main DepositPage ──────────────────────────────────────────────────────────

export default function DepositPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAppStore();

  const [amount, setAmount]               = useState('');
  const [step, setStep]                   = useState<Step>('form');
  const [loading, setLoading]             = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [paystackRef, setPaystackRef]     = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true, state: { from: '/deposit' } });
    }
  }, [currentUser, navigate]);

  // ── Wallet balance ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    walletApi.getWallet()
      .then(res => setWalletBalance((res.data as { balance?: number }).balance ?? null))
      .catch(() => {});
  }, [currentUser]);

  // ── Validation ────────────────────────────────────────────────────────────
  const parsedAmount = parseFloat(amount);
  const amountValid  = !isNaN(parsedAmount) && parsedAmount >= MIN_AMOUNT;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    if (!amountValid) return;
    setLoading(true);
    setErrorMsg('');
    setStep('processing');

    try {
      const res = await deposits.paystackInit({
        amount: parsedAmount,
        currency: 'GHS',
        channel: 'mobile_money',
      });

      const data = res.data as {
        authorizationUrl?: string;
        authorization_url?: string;
        reference?: string;
      };

      const authUrl = data.authorizationUrl ?? data.authorization_url;
      const ref     = data.reference ?? '';

      if (!authUrl) throw new Error('No authorization URL returned from Paystack.');

      setPaystackRef(ref);
      await openPaystackPopup(authUrl);
      setStep('success');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Deposit failed. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setAmount('');
    setErrorMsg('');
    setPaystackRef('');
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto p-4 text-center py-16">
        <CheckCircleIcon className="text-green-500 mx-auto mb-4" sx={{ fontSize: 64 }} />
        <h2 className="font-heading text-2xl font-bold text-green-600 mb-2">Payment Initiated</h2>
        <p className="text-lg font-semibold mb-1">{formatCurrency(parsedAmount)}</p>
        <p className="text-sm text-slate-500 mb-2">
          Your wallet will be credited once the payment is confirmed.
        </p>
        {paystackRef && (
          <p className="text-xs text-slate-400 mb-6">
            Reference: <span className="font-mono">{paystackRef}</span>
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/wallet')} className="btn-primary">Go to Wallet</button>
          <button onClick={resetForm} className="btn-secondary">Make Another Deposit</button>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="max-w-lg mx-auto p-4 text-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-2xl font-bold">✕</span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-red-600 mb-2">Deposit Failed</h2>
        <p className="text-sm text-slate-500 mb-8">{errorMsg || 'Something went wrong. Please try again.'}</p>
        <button onClick={() => { setStep('form'); setErrorMsg(''); }} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // ── Processing ────────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="max-w-lg mx-auto p-4 text-center py-16">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <AddCardIcon className="text-primary" sx={{ fontSize: 32 }} />
        </div>
        <h2 className="font-heading text-xl font-bold mb-2">Processing…</h2>
        <p className="text-sm text-slate-500">Please wait. Do not close this page.</p>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <AddCardIcon className="text-primary" />
          Deposit
        </h1>
        {walletBalance !== null && (
          <span className="text-sm text-slate-500">
            Balance:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {formatCurrency(walletBalance)}
            </strong>
          </span>
        )}
      </div>

      {/* Amount card */}
      <div className="card p-5 mb-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Amount (GH₵)
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder={`Minimum GH₵${MIN_AMOUNT}`}
          className="input-field mb-1"
          min={MIN_AMOUNT}
          step="1"
        />
        {amount && !amountValid && (
          <p className="text-xs text-red-500 mb-3">
            Minimum deposit is {formatCurrency(MIN_AMOUNT)}
          </p>
        )}
        {(!amount || amountValid) && <div className="mb-3" />}

        <div className="grid grid-cols-5 gap-2">
          {QUICK_AMOUNTS.map(qa => (
            <button
              key={qa}
              onClick={() => setAmount(qa.toString())}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                amount === qa.toString()
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {qa >= 1000 ? `${qa / 1000}k` : qa}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleDeposit}
        disabled={!amountValid || loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!amount
          ? `Enter an Amount (min GH₵${MIN_AMOUNT})`
          : !amountValid
            ? `Minimum is ${formatCurrency(MIN_AMOUNT)}`
            : `Pay ${formatCurrency(parsedAmount)} via Paystack`}
      </button>

      <p className="text-center text-xs text-slate-400 mt-3">
        🔒 Payments secured by Paystack
      </p>
    </div>
  );
}