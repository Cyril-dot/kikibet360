import { useState } from 'react';
import { useAppStore } from '../store';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';

export default function AccountPage() {
  const { user, logout, setAdminModalOpen } = useAppStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({ push: true, sms: false, email: true });
  const [depositLimit, setDepositLimit] = useState('');
  const [sessionLimit, setSessionLimit] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="card p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-2xl font-bold mb-3">
          {user.fullName.split(' ').map((n) => n[0]).join('')}
        </div>
        <h2 className="font-heading text-xl font-bold">{user.fullName}</h2>
        <p className="text-sm text-slate-500">{user.phone}</p>
        <p className="text-sm text-slate-500">{user.email}</p>
        <button className="btn-secondary mt-3 text-sm flex items-center gap-1.5 mx-auto">
          <EditIcon fontSize="small" />
          Edit Profile
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <VerifiedUserIcon fontSize="small" />
            KYC Verification
          </h3>
          <span className={`badge ${user.kycStatus === 'verified' ? 'badge-green' : user.kycStatus === 'pending' ? 'badge-amber' : 'badge-gray'}`}>
            {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
          </span>
        </div>
        {user.kycStatus === 'unverified' && (
          <button className="btn-primary w-full text-sm">Start Verification</button>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <SettingsIcon fontSize="small" />
          Change Password
        </h3>
        <div className="space-y-3">
          <input type="password" placeholder="Current Password" className="input-field" />
          <input type="password" placeholder="New Password" className="input-field" />
          <input type="password" placeholder="Confirm New Password" className="input-field" />
          <button className="btn-primary w-full text-sm">Update Password</button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <NotificationsIcon fontSize="small" />
          Notification Preferences
        </h3>
        <div className="space-y-3">
          {(['push', 'sms', 'email'] as const).map((type) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm capitalize">{type === 'push' ? 'Push Notifications' : type === 'sms' ? 'SMS' : 'Email'}</span>
              <button
                onClick={() => setNotifications((p) => ({ ...p, [type]: !p[type] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[type] ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifications[type] ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-heading text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <VerifiedUserIcon fontSize="small" />
          Responsible Gambling
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Daily Deposit Limit (GH\u20B5)</label>
            <input type="number" value={depositLimit} onChange={(e) => setDepositLimit(e.target.value)} placeholder="No limit" className="input-field" min="0" step="0.01" />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Session Time Limit (minutes)</label>
            <input type="number" value={sessionLimit} onChange={(e) => setSessionLimit(e.target.value)} placeholder="No limit" className="input-field" min="0" />
          </div>
          <button className="w-full py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            Self-Exclusion
          </button>
        </div>
      </div>

      {user.role === 'admin' && (
        <button
          onClick={() => setAdminModalOpen(true)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <AdminPanelSettingsIcon />
          Admin Panel
        </button>
      )}

      <button onClick={handleLogout} className="w-full py-3 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2">
        <LogoutIcon />
        Logout
      </button>
    </div>
  );
}
