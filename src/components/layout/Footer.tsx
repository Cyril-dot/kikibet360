import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import CasinoIcon from '@mui/icons-material/Casino';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldIcon from '@mui/icons-material/Shield';
import HelpIcon from '@mui/icons-material/Help';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// ---------------------------------------------------------------------------
// SuperBetLogo (same as Header)
// ---------------------------------------------------------------------------
function SuperBetLogo() {
  return (
    <div className="flex items-center gap-1.5 select-none" aria-label="SuperBet">
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #E24B4A 0%, #EF9F27 100%)',
          flexShrink: 0,
        }}
      >
        <LocalFireDepartmentIcon sx={{ fontSize: 18 }} style={{ color: '#ffffff' }} aria-hidden="true" />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
        <span
          style={{
            fontWeight: 900,
            fontSize: '1.15rem',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #E24B4A 0%, #EF9F27 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Super
        </span>
        <span style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          Bet
        </span>
      </div>
      <span
        style={{
          fontSize: 10,
          lineHeight: 1,
          background: 'linear-gradient(90deg, #E24B4A, #EF9F27)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 6,
        }}
        aria-hidden="true"
      >
        ★
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const quickLinks = [
  { to: '/',          label: 'Home',      icon: <HomeIcon sx={{ fontSize: 14 }} /> },
  { to: '/live',      label: 'Live Betting', icon: <FiberManualRecordIcon className="text-green-500 animate-pulse-green" sx={{ fontSize: 14 }} /> },
  { to: '/casino',    label: 'Casino',    icon: <CasinoIcon sx={{ fontSize: 14 }} /> },
  { to: '/sports',    label: 'Sports',    icon: <SportsSoccerIcon sx={{ fontSize: 14 }} /> },
  { to: '/live-tv',   label: 'Live TV',   icon: <LiveTvIcon sx={{ fontSize: 14 }} /> },
  { to: '/jackpot',   label: 'Jackpot',   icon: <EmojiEventsIcon sx={{ fontSize: 14 }} /> },
  { to: '/affiliate', label: 'Affiliate', icon: <GroupAddIcon sx={{ fontSize: 14 }} /> },
  { to: '/wallet',    label: 'Wallet',    icon: <AccountBalanceWalletIcon sx={{ fontSize: 14 }} /> },
];

const companyLinks = [
  { to: '/about',           label: 'About Us',          icon: <InfoIcon sx={{ fontSize: 14 }} /> },
  { to: '/terms',           label: 'Terms & Conditions', icon: <GavelIcon sx={{ fontSize: 14 }} /> },
  { to: '/privacy',         label: 'Privacy Policy',    icon: <SecurityIcon sx={{ fontSize: 14 }} /> },
  { to: '/responsible',     label: 'Responsible Gaming', icon: <ShieldIcon sx={{ fontSize: 14 }} /> },
  { to: '/faq',             label: 'FAQ',               icon: <HelpIcon sx={{ fontSize: 14 }} /> },
];

const socials = [
  { icon: <FacebookIcon sx={{ fontSize: 18 }} />, href: 'https://facebook.com',  label: 'Facebook',  color: '#1877F2' },
  { icon: <TwitterIcon  sx={{ fontSize: 18 }} />, href: 'https://twitter.com',   label: 'Twitter/X', color: '#000000' },
  { icon: <InstagramIcon sx={{ fontSize: 18 }} />, href: 'https://instagram.com', label: 'Instagram', color: '#E1306C' },
  { icon: <TelegramIcon  sx={{ fontSize: 18 }} />, href: 'https://t.me',          label: 'Telegram',  color: '#229ED9' },
  { icon: <YouTubeIcon   sx={{ fontSize: 18 }} />, href: 'https://youtube.com',   label: 'YouTube',   color: '#FF0000' },
];

const paymentMethods = ['MTN', 'Telecel', 'VISA', 'Mastercard', 'GTBank', 'AirtelTigo'];

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t mt-auto"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-light)' }}
    >
      {/* ── QUICK DIAL BANNER ─────────────────────────────────────────────── */}
      <div
        className="w-full py-3 flex items-center justify-center gap-3 flex-wrap text-sm font-bold tracking-wide"
        style={{
          background: 'linear-gradient(90deg, #E24B4A 0%, #EF9F27 100%)',
          color: '#fff',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ opacity: 0.85, fontWeight: 400 }}>Quick Deposit via Paybill:</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.06em' }}>*711*222#</span>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* ── COL 1: Brand ─── */}
        <div className="flex flex-col gap-4">
          <Link to="/">
            <SuperBetLogo />
          </Link>

          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: 240 }}>
            The world's most visited betting platform. Bet on sports, play casino games and win big — responsibly.
          </p>

          {/* Socials */}
          <div className="flex items-center gap-2 flex-wrap">
            {socials.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: 'var(--card-alt)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = s.color;
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                  (e.currentTarget as HTMLElement).style.borderColor = s.color;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)';
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Partner logos placeholder */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: 'var(--card-alt)', color: 'var(--text-muted)' }}>
              Official Betting Partner
            </span>
          </div>
        </div>

        {/* ── COL 2: Quick Links ─── */}
        <div>
          <h3
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{
              background: 'linear-gradient(90deg, #E24B4A 0%, #EF9F27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Quick Links
          </h3>
          <ul className="flex flex-col gap-2">
            {quickLinks.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex items-center gap-2 text-xs transition-colors group"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--primary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                >
                  <span style={{ opacity: 0.6 }}>{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── COL 3: Company ─── */}
        <div>
          <h3
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{
              background: 'linear-gradient(90deg, #E24B4A 0%, #EF9F27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Company
          </h3>
          <ul className="flex flex-col gap-2">
            {companyLinks.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex items-center gap-2 text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--primary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                >
                  <span style={{ opacity: 0.6 }}>{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── COL 4: Contact ─── */}
        <div>
          <h3
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{
              background: 'linear-gradient(90deg, #E24B4A 0%, #EF9F27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Connect With Us
          </h3>

          <div className="flex flex-col gap-3">
            {/* Phone */}
            <a
              href="tel:0596921899"
              className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
            >
              <PhoneIcon sx={{ fontSize: 14 }} style={{ opacity: 0.6 }} />
              0596 921 899
            </a>

            {/* Email */}
            <a
              href="mailto:support@superbet.com"
              className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
            >
              <EmailIcon sx={{ fontSize: 14 }} style={{ opacity: 0.6 }} />
              support@superbet.com
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/superbet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#229ED9'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
            >
              <TelegramIcon sx={{ fontSize: 14 }} style={{ opacity: 0.6 }} />
              @superbet on Telegram
            </a>

            {/* Payment methods */}
            <div className="mt-2">
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                Payment Methods
              </p>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map(m => (
                  <span
                    key={m}
                    className="text-xs px-2 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: 'var(--card-alt)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESPONSIBLE GAMING BANNER ─────────────────────────────────────── */}
      <div
        className="border-t"
        style={{ borderColor: 'var(--border-light)' }}
      >
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">

          {/* 18+ + disclaimer */}
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-xs"
              style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
            >
              18+
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: 420 }}>
              Age 18 and above only. Play Responsibly. Betting is addictive and can be psychologically harmful.
            </p>
          </div>

          {/* License */}
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-9 h-9 rounded flex items-center justify-center"
              style={{ backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-light)' }}
            >
              <ShieldIcon sx={{ fontSize: 18 }} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: 380 }}>
              SuperBet is licensed by the Gaming Commission under the Gaming Act, 2006 (Act, 721) under License No 0000237.
            </p>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────────────────── */}
      <div
        className="border-t"
        style={{ borderColor: 'var(--border-light)', backgroundColor: 'color-mix(in srgb, var(--card-bg) 80%, #000 20%)' }}
      >
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            © {year} SuperBet. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {['Terms', 'Privacy', 'Cookies'].map(t => (
              <Link
                key={t}
                to={`/${t.toLowerCase()}`}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-muted)', opacity: 0.6 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}