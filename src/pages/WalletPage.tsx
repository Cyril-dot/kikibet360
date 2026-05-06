import { useState } from 'react';
import { useAppStore } from '../store';
import { formatCurrency } from '../utils';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCardIcon from '@mui/icons-material/AddCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Link } from 'react-router-dom';

export default function WalletPage() {
  const { mainWalletBalance, affiliateWalletBalance, transactions } = useAppStore();
  const [showMainBalance, setShowMainBalance] = useState(true);
  const [showAffiliateBalance, setShowAffiliateBalance] = useState(true);

  const totalAffiliateEarned = 4650;
  const pendingAffiliate = 320;
  const withdrawnAffiliate = 1550;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownwardIcon className="text-green-500" fontSize="small" />;
      case 'withdrawal': return <ArrowUpwardIcon className="text-red-500" fontSize="small" />;
      case 'bet_win': return <ArrowDownwardIcon className="text-green-500" fontSize="small" />;
      case 'bet_loss': return <ArrowUpwardIcon className="text-red-500" fontSize="small" />;
      case 'affiliate': return <ArrowDownwardIcon className="text-blue-500" fontSize="small" />;
      default: return null;
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'deposit' || type === 'bet_win' || type === 'affiliate' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
        <AccountBalanceWalletIcon className="text-primary" />
        Wallet
      </h1>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Main Wallet</h2>
          <button onClick={() => setShowMainBalance(!showMainBalance)} className="p-1 text-slate-400 hover:text-slate-600">
            {showMainBalance ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </button>
        </div>
        <p className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          {showMainBalance ? formatCurrency(mainWalletBalance) : 'GH\u20B5****'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Link to="/deposit" className="btn-primary flex items-center justify-center gap-1.5 text-sm py-2">
            <AddCardIcon fontSize="small" />
            Deposit
          </Link>
          <button className="btn-secondary flex items-center justify-center gap-1.5 text-sm py-2">
            <PaymentsIcon fontSize="small" />
            Withdraw
          </button>
          <button className="btn-secondary flex items-center justify-center gap-1.5 text-sm py-2">
            <SwapHorizIcon fontSize="small" />
            Transfer
          </button>
        </div>
      </div>

      <div className="card p-5 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Affiliate Earnings Wallet</h2>
          <button onClick={() => setShowAffiliateBalance(!showAffiliateBalance)} className="p-1 text-slate-400 hover:text-slate-600">
            {showAffiliateBalance ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </button>
        </div>
        <p className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          {showAffiliateBalance ? formatCurrency(affiliateWalletBalance) : 'GH\u20B5****'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Funds in affiliate wallet cannot be used for betting. Withdraw to your bank account.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div>
            <p className="text-xs text-slate-500">Total Earned</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(totalAffiliateEarned)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-sm font-bold text-amber-600">{formatCurrency(pendingAffiliate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Withdrawn</p>
            <p className="text-sm font-bold text-slate-600">{formatCurrency(withdrawnAffiliate)}</p>
          </div>
        </div>
        <button className="btn-secondary w-full flex items-center justify-center gap-1.5 text-sm">
          <PaymentsIcon fontSize="small" />
          Withdraw Affiliate Earnings
        </button>
      </div>

      <div className="card p-5">
        <h2 className="font-heading text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {getTransactionIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <p className="text-xs text-slate-500">{tx.date}</p>
              </div>
              <span className={`text-sm font-bold ${getTransactionColor(tx.type)}`}>
                {tx.type === 'deposit' || tx.type === 'bet_win' || tx.type === 'affiliate' ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
