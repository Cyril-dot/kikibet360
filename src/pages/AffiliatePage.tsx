import { affiliateStats } from '../data/mock';
import { formatCurrency } from '../utils';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShareIcon from '@mui/icons-material/Share';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';

export default function AffiliatePage() {
  const { showToast } = useAppStore();
  const referralLink = 'https://futball.com/ref/KWAME2024';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    showToast('Referral link copied!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <GroupAddIcon className="text-primary" fontSize="large" />
        <h1 className="font-heading text-2xl font-bold">Affiliate Program</h1>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Your Referral Link</h2>
        <div className="flex gap-2">
          <input type="text" value={referralLink} readOnly className="input-field flex-1" />
          <button onClick={copyLink} className="btn-primary flex items-center gap-1.5 shrink-0">
            <ContentCopyIcon fontSize="small" />
            Copy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Referrals', value: affiliateStats.totalReferrals.toString(), icon: <GroupAddIcon className="text-primary" /> },
          { label: 'Active Players', value: affiliateStats.activePlayers.toString(), icon: <LeaderboardIcon className="text-green-500" /> },
          { label: 'Total Earned', value: formatCurrency(affiliateStats.totalEarned), icon: <AccountBalanceWalletIcon className="text-blue-500" /> },
          { label: 'This Month', value: formatCurrency(affiliateStats.thisMonthEarnings), icon: <ShareIcon className="text-amber-500" /> },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="flex justify-center mb-2">{stat.icon}</div>
            <p className="font-heading text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider">Affiliate Wallet</h2>
          <Link to="/wallet" className="text-sm text-primary font-medium hover:underline">View Wallet</Link>
        </div>
        <p className="font-heading text-2xl font-bold text-green-600 mb-2">{formatCurrency(affiliateStats.thisMonthEarnings)}</p>
        <p className="text-xs text-slate-500">Available to withdraw</p>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Referred Players</h2>
        <div className="space-y-2">
          {affiliateStats.referredPlayers.map((player, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium">{player.id}</p>
                <p className="text-xs text-slate-500">Joined: {player.joinDate}</p>
              </div>
              <span className={`badge ${player.active ? 'badge-green' : 'badge-gray'}`}>
                {player.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Commission Tiers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 text-slate-500 font-medium">Referrals</th>
                <th className="text-right py-2 text-slate-500 font-medium">Commission Rate</th>
              </tr>
            </thead>
            <tbody>
              {affiliateStats.commissionTiers.map((tier, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="py-2">{tier.min} - {tier.max === 999 ? '∞' : tier.max}</td>
                  <td className="py-2 text-right font-bold text-primary">{tier.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Withdrawal History</h2>
        <div className="space-y-2">
          {affiliateStats.withdrawalHistory.map((w, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium">{formatCurrency(w.amount)}</p>
                <p className="text-xs text-slate-500">{w.date}</p>
              </div>
              <span className="badge-green">{w.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: 1, title: 'Share Your Link', desc: 'Send your unique referral link to friends via social media or messaging.' },
            { step: 2, title: 'They Register & Deposit', desc: 'When your friend signs up and makes their first deposit, you earn commission.' },
            { step: 3, title: 'Earn Commission', desc: 'Get up to 30% commission on your referrals\' activity. Withdraw anytime.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mx-auto mb-2">
                {item.step}
              </div>
              <h3 className="font-heading text-sm font-bold mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
