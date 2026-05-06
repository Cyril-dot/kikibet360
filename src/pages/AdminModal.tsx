import { useState } from 'react';
import { useAppStore } from '../store';
import { formatCurrency } from '../utils';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PaymentsIcon from '@mui/icons-material/Payments';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';

const adminSections = [
  { key: 'dashboard', label: 'Dashboard', icon: <AdminPanelSettingsIcon fontSize="small" /> },
  { key: 'bets', label: 'Bet Management', icon: <ReceiptLongIcon fontSize="small" /> },
  { key: 'users', label: 'User Management', icon: <PeopleIcon fontSize="small" /> },
  { key: 'promos', label: 'Promo Management', icon: <LocalOfferIcon fontSize="small" /> },
  { key: 'withdrawals', label: 'Withdrawal Approvals', icon: <PaymentsIcon fontSize="small" /> },
  { key: 'reports', label: 'Reports', icon: <BarChartIcon fontSize="small" /> },
];

const mockUsers = [
  { id: 'usr_001', name: 'Kwame Asante', phone: '0241234567', status: 'active', bets: 45, balance: 1250 },
  { id: 'usr_002', name: 'Ama Mensah', phone: '0209876543', status: 'active', bets: 23, balance: 580 },
  { id: 'usr_003', name: 'Kofi Boateng', phone: '0275551234', status: 'suspended', bets: 12, balance: 0 },
  { id: 'usr_004', name: 'Abena Osei', phone: '0503339876', status: 'active', bets: 67, balance: 3200 },
];

const mockWithdrawals = [
  { id: 'w1', userId: 'usr_002', name: 'Ama Mensah', amount: 200, type: 'main', status: 'pending', date: '2026-05-06' },
  { id: 'w2', userId: 'usr_004', name: 'Abena Osei', amount: 500, type: 'affiliate', status: 'pending', date: '2026-05-05' },
  { id: 'w3', userId: 'usr_001', name: 'Kwame Asante', amount: 100, type: 'main', status: 'pending', date: '2026-05-06' },
];

export default function AdminModal() {
  const { isAdminModalOpen, setAdminModalOpen, bets } = useAppStore();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isAdminModalOpen) return null;

  const kpis = [
    { label: 'Total Users', value: '1,247', change: '+12' },
    { label: 'Active Bets', value: '89', change: '+5' },
    { label: 'Revenue Today', value: formatCurrency(8450), change: '+15%' },
    { label: 'Pending Withdrawals', value: '3', change: '' },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/95 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <AdminPanelSettingsIcon className="text-primary" />
          <h1 className="font-heading text-lg font-bold text-white">Admin Panel</h1>
        </div>
        <button onClick={() => setAdminModalOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="hidden md:flex w-56 flex-col border-r border-slate-700 bg-slate-800 p-3 gap-1">
          {adminSections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.key
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </nav>

        <div className="md:hidden flex overflow-x-auto gap-1 p-3 border-b border-slate-700 scrollbar-hide">
          {adminSections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === section.key
                  ? 'bg-primary text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900">
          {activeSection === 'dashboard' && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-4">Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">{kpi.label}</p>
                    <p className="font-heading text-2xl font-bold text-white">{kpi.value}</p>
                    {kpi.change && <p className="text-xs text-green-400 mt-1">{kpi.change}</p>}
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="font-heading text-sm font-bold text-slate-400 mb-4">Revenue Chart (Placeholder)</h3>
                <div className="flex items-end gap-2 h-40">
                  {[35, 55, 42, 68, 75, 60, 85, 90, 72, 95, 80, 88].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/60 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'bets' && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-4">Bet Management</h2>
              <div className="flex gap-2 mb-4">
                {['all', 'pending', 'won', 'lost'].map((f) => (
                  <button key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 capitalize">
                    {f}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {bets.map((bet) => (
                  <div key={bet.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{bet.selections.length} selections - {formatCurrency(bet.stake)}</p>
                      <p className="text-xs text-slate-400">{bet.placedAt.split('T')[0]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${bet.status === 'won' ? 'badge-green' : bet.status === 'lost' ? 'badge-gray' : 'badge-amber'}`}>
                        {bet.status.toUpperCase()}
                      </span>
                      <button className="p-1.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"><CheckIcon fontSize="small" /></button>
                      <button className="p-1.5 rounded bg-slate-700 text-slate-300 hover:bg-red-600"><BlockIcon fontSize="small" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-4">User Management</h2>
              <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-2">
                {mockUsers.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery)).map((user) => (
                  <div key={user.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.phone} | {user.bets} bets | {formatCurrency(user.balance)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${user.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {user.status.toUpperCase()}
                      </span>
                      <button className="p-1.5 rounded bg-slate-700 text-slate-300 hover:bg-red-600"><BlockIcon fontSize="small" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'promos' && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-4">Promo Management</h2>
              <button className="btn-primary mb-4 text-sm">Create New Promo</button>
              <div className="space-y-2">
                {[
                  { id: '1', title: '100% First Deposit Bonus', active: true },
                  { id: '2', title: 'Multi-Bet Boost +30%', active: true },
                  { id: '3', title: 'Refer & Earn GH\u20B5200', active: true },
                  { id: '6', title: 'Summer Special Bonus', active: false },
                ].map((promo) => (
                  <div key={promo.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{promo.title}</p>
                      <span className={`badge ${promo.active ? 'badge-green' : 'badge-gray'}`}>
                        {promo.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600">Edit</button>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'withdrawals' && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-4">Withdrawal Approvals</h2>
              <div className="space-y-2">
                {mockWithdrawals.map((w) => (
                  <div key={w.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{w.name} - {formatCurrency(w.amount)}</p>
                      <p className="text-xs text-slate-400">{w.type} wallet | {w.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50"><CheckIcon fontSize="small" /></button>
                      <button className="p-1.5 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50"><BlockIcon fontSize="small" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'reports' && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-4">Reports</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="font-heading text-sm font-bold text-slate-400 mb-3">Registrations</h3>
                  <div className="flex items-end gap-1 h-32">
                    {[20, 35, 28, 42, 55, 48, 62].map((h, i) => (
                      <div key={i} className="flex-1 bg-blue-500/60 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="font-heading text-sm font-bold text-slate-400 mb-3">Top Leagues by Bet Volume</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Premier League', pct: 35 },
                      { name: 'La Liga', pct: 25 },
                      { name: 'Champions League', pct: 20 },
                      { name: 'Serie A', pct: 12 },
                      { name: 'Ghana Premier', pct: 8 },
                    ].map((l) => (
                      <div key={l.name}>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{l.name}</span>
                          <span>{l.pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full">
                          <div className="h-2 bg-primary rounded-full" style={{ width: `${l.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
