import { useState } from 'react';
import { useAppStore } from '../store';
import { formatCurrency } from '../utils';
import AddCardIcon from '@mui/icons-material/AddCard';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const quickAmounts = [10, 20, 50, 100, 200, 500];
const networks = ['MTN', 'Vodafone', 'AirtelTigo'];

export default function DepositPage() {
  const navigate = useNavigate();
  const { deposit, showToast } = useAppStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'momo' | 'bank' | 'card'>('momo');
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  const handleDeposit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    deposit(amt);
    setStep('success');
    showToast('Deposit successful!', 'success');
  };

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto p-4 text-center py-16">
        <CheckCircleIcon className="text-green-500 mx-auto mb-4" sx={{ fontSize: 64 }} />
        <h2 className="font-heading text-2xl font-bold text-green-600 mb-2">Deposit Successful</h2>
        <p className="text-lg font-semibold mb-1">{formatCurrency(parseFloat(amount))}</p>
        <p className="text-sm text-slate-500 mb-6">has been added to your wallet</p>
        <button onClick={() => navigate('/wallet')} className="btn-primary">Go to Wallet</button>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="max-w-lg mx-auto p-4">
        <button onClick={() => setStep('form')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4">
          <ArrowBackIcon fontSize="small" /> Back
        </button>
        <h2 className="font-heading text-xl font-bold mb-6">Confirm Deposit</h2>
        <div className="card p-5 space-y-3 mb-6">
          <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold">{formatCurrency(parseFloat(amount))}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="font-medium">{method === 'momo' ? 'Mobile Money' : method === 'bank' ? 'Bank Transfer' : 'Card'}</span></div>
          {method === 'momo' && (
            <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium">{phone}</span></div>
          )}
          {method === 'momo' && (
            <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="font-medium">{network}</span></div>
          )}
        </div>
        <button onClick={handleDeposit} className="btn-primary w-full">Confirm Deposit</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="font-heading text-2xl font-bold flex items-center gap-2 mb-6">
        <AddCardIcon className="text-primary" />
        Deposit
      </h1>

      <div className="card p-5 mb-4 bg-primary/5 dark:bg-primary/10 border-primary/20">
        <p className="text-sm font-medium text-primary">Deposit GH\u20B550+ to unlock your 100% First Deposit Bonus up to GH\u20B51,000!</p>
      </div>

      <div className="card p-5 mb-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Amount (GH\u20B5)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="input-field mb-3"
          min="0"
          step="0.01"
        />
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((qa) => (
            <button
              key={qa}
              onClick={() => setAmount(qa.toString())}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                amount === qa.toString()
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              GH\u20B5{qa}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Payment Method</label>
        <div className="flex gap-2 mb-4">
          {[
            { key: 'momo' as const, label: 'Mobile Money', icon: <PhoneAndroidIcon fontSize="small" /> },
            { key: 'bank' as const, label: 'Bank Transfer', icon: <AccountBalanceIcon fontSize="small" /> },
            { key: 'card' as const, label: 'Card', icon: <CreditCardIcon fontSize="small" /> },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium transition-colors ${
                method === m.key ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {method === 'momo' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="input-field"
              >
                {networks.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0XX XXX XXXX"
                className="input-field"
              />
            </div>
          </div>
        )}

        {method === 'bank' && (
          <div className="text-sm text-slate-500 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="font-medium mb-1">Bank Transfer Details</p>
            <p>Bank: GCB Bank</p>
            <p>Account: Futball Ltd</p>
            <p>Account No: 1234567890</p>
          </div>
        )}

        {method === 'card' && (
          <div className="space-y-3">
            <input type="text" placeholder="Card Number" className="input-field" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="MM/YY" className="input-field" />
              <input type="text" placeholder="CVV" className="input-field" />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (amount && parseFloat(amount) > 0) setStep('confirm');
        }}
        disabled={!amount || parseFloat(amount) <= 0}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
