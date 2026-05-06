import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, showToast } = useAppStore();
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', password: '', confirmPassword: '', referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (!terms) {
      showToast('Please accept the terms', 'error');
      return;
    }
    login({
      id: `usr_${Date.now()}`,
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      role: 'user',
      kycStatus: 'unverified',
      referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    });
    showToast('Registration successful!', 'success');
    navigate('/');
  };

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-red-800 items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <SportsSoccerIcon sx={{ fontSize: 64 }} className="mx-auto mb-6" />
          <h1 className="font-heading text-4xl font-bold mb-4">Join Futball</h1>
          <p className="text-lg opacity-90 mb-6">Get 100% First Deposit Bonus up to GH\u20B51,000 when you sign up today!</p>
          <div className="space-y-3 text-left bg-white/10 rounded-xl p-6">
            <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">1</span> Create your account</p>
            <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">2</span> Make your first deposit</p>
            <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">3</span> Start betting and winning!</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <SportsSoccerIcon className="text-primary" fontSize="large" />
            <span className="font-heading text-2xl font-bold text-primary">Futball</span>
          </div>
          <h2 className="font-heading text-2xl font-bold mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Full Name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="input-field" required />
            <input type="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" required />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" required />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </button>
            </div>
            <input type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="input-field" required />
            <input type="text" placeholder="Referral Code (optional)" value={form.referralCode} onChange={(e) => update('referralCode', e.target.value)} className="input-field" />
            <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 rounded border-slate-300" />
              I agree to the Terms & Conditions and Privacy Policy
            </label>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <PersonAddIcon fontSize="small" />
              Register
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
