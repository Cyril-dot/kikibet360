import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { useAppStore } from '../store';
import {
  wallet as walletApi,
  withdrawals,
  affiliate,
  Transaction,
  AffiliateStatsDTO,
} from '../utils/api';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCardIcon from '@mui/icons-material/AddCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RefreshIcon from '@mui/icons-material/Refresh';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WalletData {
  balance: number;
  currency?: string;
  [key: string]: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const INCOMING_KINDS = [
  'DEPOSIT', 'BET_WIN', 'REFERRAL_COMMISSION', 'PAYOUT',
  'VIP_CASHBACK', 'WELCOME_BONUS', 'WITHDRAWAL_REFUND', 'ADJUSTMENT',
];

function txIcon(kind: string) {
  return INCOMING_KINDS.includes(kind)
    ? <ArrowDownwardIcon className="text-green-500" fontSize="small" />
    : <ArrowUpwardIcon className="text-red-500" fontSize="small" />;
}

function txColor(kind: string): string {
  return INCOMING_KINDS.includes(kind)
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
}

function txSign(kind: string): string {
  return INCOMING_KINDS.includes(kind) ? '+' : '-';
}

function txLabel(kind: string): string {
  const map: Record<string, string> = {
    DEPOSIT: 'Deposit',
    WITHDRAW: 'Withdrawal',
    WITHDRAW_HOLD: 'Withdrawal Hold',
    WITHDRAW_RELEASE: 'Withdrawal Released',
    BET_STAKE: 'Bet Placed',
    BET_WIN: 'Bet Won',
    REFERRAL_COMMISSION: 'Affiliate Commission',
    PAYOUT: 'Payout',
    ADJUSTMENT: 'Adjustment',
    VIP_CASHBACK: 'VIP Cashback',
    VIP_MEMBERSHIP: 'VIP Membership',
    WELCOME_BONUS: 'Welcome Bonus',
    WITHDRAWAL_REFUND: 'Withdrawal Refund',
    ADMIN_UPGRADE_FEE: 'Admin Upgrade Fee',
  };
  return map[kind] ?? kind;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Withdraw Modal ────────────────────────────────────────────────────────────

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  balance: number;
}

function WithdrawModal({ open, onClose, onSuccess, balance }: WithdrawModalProps) {
  const [step, setStep]                   = useState<'form' | 'confirm' | 'done'>('form');
  const [amount, setAmount]               = useState('');
  const [method, setMethod]               = useState('momo');
  const [network, setNetwork]             = useState('MTN');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName]     = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const reset = () => {
    setStep('form'); setAmount(''); setMethod('momo');
    setNetwork('MTN'); setAccountNumber(''); setAccountName(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await withdrawals.submit({
        amount: parseFloat(amount),
        method,
        accountNumber,
        accountName,
        network: method === 'momo' ? network : undefined,
      });
      setStep('done');
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    // z-[99999] beats BottomNav's z-[9999]
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >

        {step === 'done' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
              <PaymentsIcon className="text-green-600" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">Withdrawal Requested</h3>
            <p className="text-slate-500 text-sm mb-6">Your request is being reviewed. Funds will be sent shortly.</p>
            <button onClick={handleClose} className="btn-primary w-full">Done</button>
          </div>

        ) : step === 'confirm' ? (
          <>
            <h3 className="font-heading text-lg font-bold mb-4">Confirm Withdrawal</h3>
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Method</span>
                <span>{method === 'momo' ? 'Mobile Money' : 'Bank Transfer'}</span>
              </div>
              {method === 'momo' && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Network</span>
                  <span>{network}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Account</span>
                <span className="font-mono">{accountNumber}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Name</span>
                <span>{accountName}</span>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="btn-secondary flex-1" disabled={loading}>Back</button>
              <button onClick={submit} className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </>

        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold">Withdraw Funds</h3>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Available: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(balance)}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Amount (GH₵)</label>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" className="input-field" min="1" step="0.01"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Method</label>
                <div className="flex gap-2">
                  {['momo', 'bank'].map(m => (
                    <button
                      key={m} onClick={() => setMethod(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        method === m
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {m === 'momo' ? 'Mobile Money' : 'Bank Transfer'}
                    </button>
                  ))}
                </div>
              </div>
              {method === 'momo' ? (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Network</label>
                  <select value={network} onChange={e => setNetwork(e.target.value)} className="input-field">
                    {['MTN', 'AirtelTigo', 'Telecel'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Bank Name</label>
                  <input
                    type="text" value={network} onChange={e => setNetwork(e.target.value)}
                    placeholder="e.g. GCB Bank" className="input-field"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  {method === 'momo' ? 'Phone Number' : 'Account Number'}
                </label>
                <input
                  type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                  placeholder={method === 'momo' ? '0XX XXX XXXX' : 'Account number'}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Account Name</label>
                <input
                  type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
                  placeholder="Full name on account" className="input-field"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (amount && parseFloat(amount) > 0 && accountNumber && accountName) setStep('confirm');
              }}
              disabled={!amount || parseFloat(amount) <= 0 || !accountNumber || !accountName}
              className="btn-primary w-full mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Affiliate Withdraw Modal ───────────────────────────────────────────────────

interface AffiliateWithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
}

function AffiliateWithdrawModal({ open, onClose, onSuccess, availableBalance }: AffiliateWithdrawModalProps) {
  const [step, setStep]                   = useState<'form' | 'done'>('form');
  const [amount, setAmount]               = useState('');
  const [bankName, setBankName]           = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName]     = useState('');
  const [momoNumber, setMomoNumber]       = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const reset = () => {
    setStep('form'); setAmount(''); setBankName('');
    setAccountNumber(''); setAccountName(''); setMomoNumber(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await affiliate.requestWithdrawal({
        amount: parseFloat(amount),
        accountDetails: {
          bankName,
          accountNumber,
          accountName,
          mobileMoneyNumber: momoNumber || undefined,
        },
      });
      setStep('done');
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    // z-[99999] beats BottomNav's z-[9999]
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {step === 'done' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
              <PaymentsIcon className="text-blue-600" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">Request Submitted</h3>
            <p className="text-slate-500 text-sm mb-6">Your affiliate earnings withdrawal is being processed.</p>
            <button onClick={handleClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold">Withdraw Affiliate Earnings</h3>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Available: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(availableBalance)}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Amount (GH₵)</label>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" className="input-field" min="1" step="0.01" max={availableBalance}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Bank Name</label>
                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. GCB Bank" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Account Number</label>
                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account number" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Account Name</label>
                <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full name on account" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Mobile Money Number <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input type="tel" value={momoNumber} onChange={e => setMomoNumber(e.target.value)} placeholder="0XX XXX XXXX" className="input-field" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <button
              onClick={submit}
              disabled={loading || !amount || parseFloat(amount) <= 0 || !bankName || !accountNumber || !accountName}
              className="btn-primary w-full mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main WalletPage ───────────────────────────────────────────────────────────

export default function WalletPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAppStore();

  const [walletData, setWalletData]           = useState<WalletData | null>(null);
  const [transactions, setTransactions]       = useState<Transaction[]>([]);
  const [affiliateStats, setAffiliateStats]   = useState<AffiliateStatsDTO | null>(null);
  const [txPage, setTxPage]                   = useState(0);
  const [txTotalPages, setTxTotalPages]       = useState(1);
  const [loading, setLoading]                 = useState(true);
  const [txLoading, setTxLoading]             = useState(false);
  const [fetchError, setFetchError]           = useState('');
  const [showBalance, setShowBalance]         = useState(true);
  const [showAffBalance, setShowAffBalance]   = useState(true);
  const [showWithdraw, setShowWithdraw]       = useState(false);
  const [showAffWithdraw, setShowAffWithdraw] = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true, state: { from: '/wallet' } });
    }
  }, [currentUser, navigate]);

  // ── Data loaders ──────────────────────────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    const res = await walletApi.getWallet();
    setWalletData(res.data as WalletData);
  }, []);

  const fetchTransactions = useCallback(async (page = 0) => {
    setTxLoading(true);
    try {
      const res = await walletApi.getTransactions(page, 20);
      setTransactions(prev => page === 0 ? res.data.content : [...prev, ...res.data.content]);
      setTxTotalPages(res.data.totalPages);
      setTxPage(page);
    } finally {
      setTxLoading(false);
    }
  }, []);

  const fetchAffiliateStats = useCallback(async () => {
    try {
      const res = await affiliate.getStats();
      setAffiliateStats(res.data);
    } catch {
      // Not all users are affiliates — silently ignore
    }
  }, []);

  const initLoad = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      await Promise.all([fetchWallet(), fetchTransactions(0), fetchAffiliateStats()]);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [fetchWallet, fetchTransactions, fetchAffiliateStats]);

  useEffect(() => {
    if (currentUser) initLoad();
  }, [currentUser, initLoad]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const mainBalance      = walletData?.balance ?? 0;
  const affiliateBalance = affiliateStats?.availableBalance ?? 0;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-lg mx-auto p-4 text-center py-16">
        <p className="text-red-500 mb-4">{fetchError}</p>
        <button onClick={initLoad} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto p-4 space-y-4 pb-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <AccountBalanceWalletIcon className="text-primary" />
              Wallet
            </h1>
            {currentUser && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {currentUser.fullName}
              </p>
            )}
          </div>
          <button
            onClick={initLoad}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshIcon fontSize="small" />
          </button>
        </div>

        {/* ── Main Balance Hero ───────────────────────────────────────────── */}
        <div className="card p-6 bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white/70 uppercase tracking-wider">Main Balance</span>
            <button
              onClick={() => setShowBalance(v => !v)}
              className="p-1 text-white/60 hover:text-white transition-colors"
            >
              {showBalance ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </button>
          </div>

          <p className="font-heading text-4xl font-bold tracking-tight mb-6">
            {showBalance ? formatCurrency(mainBalance) : 'GH₵ ••••'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/deposit"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white text-primary font-semibold text-sm rounded-xl hover:bg-white/90 transition-colors"
            >
              <AddCardIcon fontSize="small" />
              Deposit
            </Link>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white/15 text-white font-semibold text-sm rounded-xl hover:bg-white/25 transition-colors border border-white/20"
            >
              <PaymentsIcon fontSize="small" />
              Withdraw
            </button>
          </div>
        </div>

        {/* ── Affiliate Earnings Card ─────────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                💰 Affiliate Earnings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Withdraw to your bank account</p>
            </div>
            <button
              onClick={() => setShowAffBalance(v => !v)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showAffBalance ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </button>
          </div>

          <p className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {showAffBalance ? formatCurrency(affiliateBalance) : 'GH₵ ••••'}
          </p>

          {/* Affiliate stats row */}
          {affiliateStats && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-lg mb-0.5">📈</p>
                <p className="text-xs text-slate-500 mb-0.5">Total Earned</p>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(affiliateStats.lifetimeCommission)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-lg mb-0.5">👥</p>
                <p className="text-xs text-slate-500 mb-0.5">Referrals</p>
                <p className="text-sm font-bold text-blue-600">
                  {affiliateStats.totalReferrals}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-lg mb-0.5">💳</p>
                <p className="text-xs text-slate-500 mb-0.5">Available</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatCurrency(affiliateStats.availableBalance)}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowAffWithdraw(true)}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
          >
            <PaymentsIcon fontSize="small" />
            Withdraw Affiliate Earnings
          </button>
        </div>

        {/* ── Recent Transactions ─────────────────────────────────────────── */}
        <div className="card p-5">
          <h2 className="font-heading text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Recent Transactions
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <AccountBalanceWalletIcon className="text-slate-300 dark:text-slate-600 mx-auto mb-2" sx={{ fontSize: 40 }} />
              <p className="text-sm text-slate-400">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {txIcon(tx.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{txLabel(tx.kind)}</p>
                    <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${txColor(tx.kind)}`}>
                      {txSign(tx.kind)}{formatCurrency(tx.amount)}
                    </p>
                    {tx.balanceAfter !== undefined && (
                      <p className="text-xs text-slate-400">
                        Bal: {formatCurrency(tx.balanceAfter)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {txPage + 1 < txTotalPages && (
            <button
              onClick={() => fetchTransactions(txPage + 1)}
              disabled={txLoading}
              className="btn-secondary w-full mt-4 text-sm disabled:opacity-50"
            >
              {txLoading ? 'Loading…' : 'Load More'}
            </button>
          )}
        </div>

      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <WithdrawModal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        onSuccess={() => { setShowWithdraw(false); fetchWallet(); fetchTransactions(0); }}
        balance={mainBalance}
      />
      <AffiliateWithdrawModal
        open={showAffWithdraw}
        onClose={() => setShowAffWithdraw(false)}
        onSuccess={() => { setShowAffWithdraw(false); fetchAffiliateStats(); }}
        availableBalance={affiliateBalance}
      />
    </>
  );
}