import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import LoginIcon from '@mui/icons-material/Login';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, showToast } = useAppStore();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: 'usr_admin_001',
      fullName: 'Kwame Asante',
      phone: '0241234567',
      email: 'kwame@example.com',
      role: 'admin',
      kycStatus: 'verified',
      referralCode: 'REFKWAME',
    });
    showToast('Login successful!', 'success');
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-red-800 items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <SportsSoccerIcon sx={{ fontSize: 64 }} className="mx-auto mb-6" />
          <h1 className="font-heading text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-lg opacity-90">Log in to your Futball account and continue betting on your favorite sports.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <SportsSoccerIcon className="text-primary" fontSize="large" />
            <span className="font-heading text-2xl font-bold text-primary">Futball</span>
          </div>
          <h2 className="font-heading text-2xl font-bold mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Phone or Email"
              value={form.identifier}
              onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
              className="input-field"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="input-field pr-10"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-slate-300" />
                Remember me
              </label>
              <button type="button" className="text-sm text-primary font-medium hover:underline">Forgot Password?</button>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <LoginIcon fontSize="small" />
              Login
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
