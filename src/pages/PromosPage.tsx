import { useState } from 'react';
import { promos } from '../data/mock';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupIcon from '@mui/icons-material/Group';
import StarIcon from '@mui/icons-material/Star';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Promo = (typeof promos)[number];

// ---------------------------------------------------------------------------
// Real Unsplash images per promo type
// welcome_bonus  → gift / money celebration
// free_bet       → football match / stadium
// cashback       → coins / money
// reload_bonus   → sports action
// accumulator    → trophy / winners
// odds_boost     → sprinting athlete
// vip            → luxury / velvet rope
// referral       → friends / handshake
// ---------------------------------------------------------------------------
const PROMO_VISUALS: Record<string, {
  image: string;
  overlay: string;
  accent: string;
  accentGrad: string;
}> = {
  welcome_bonus: {
    image: 'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=600&q=80',
    overlay: 'from-purple-900/80 via-purple-700/40 to-transparent',
    accent: '#a855f7',
    accentGrad: 'linear-gradient(135deg,#7c3aed,#a855f7)',
  },
  free_bet: {
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
    overlay: 'from-emerald-900/80 via-teal-700/40 to-transparent',
    accent: '#10b981',
    accentGrad: 'linear-gradient(135deg,#059669,#10b981)',
  },
  cashback: {
    image: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=600&q=80',
    overlay: 'from-orange-900/80 via-amber-700/40 to-transparent',
    accent: '#f97316',
    accentGrad: 'linear-gradient(135deg,#ea580c,#f97316)',
  },
  reload_bonus: {
    image: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=600&q=80',
    overlay: 'from-blue-900/80 via-indigo-700/40 to-transparent',
    accent: '#6366f1',
    accentGrad: 'linear-gradient(135deg,#4338ca,#6366f1)',
  },
  accumulator: {
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80',
    overlay: 'from-rose-900/80 via-pink-700/40 to-transparent',
    accent: '#f43f5e',
    accentGrad: 'linear-gradient(135deg,#e11d48,#f43f5e)',
  },
  odds_boost: {
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&q=80',
    overlay: 'from-sky-900/80 via-blue-700/40 to-transparent',
    accent: '#0ea5e9',
    accentGrad: 'linear-gradient(135deg,#0284c7,#0ea5e9)',
  },
  vip: {
    image: 'https://images.unsplash.com/photo-1551958219-acbc595b65a0?w=600&q=80',
    overlay: 'from-yellow-900/80 via-amber-700/40 to-transparent',
    accent: '#eab308',
    accentGrad: 'linear-gradient(135deg,#ca8a04,#eab308)',
  },
  referral: {
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80',
    overlay: 'from-slate-900/80 via-slate-700/40 to-transparent',
    accent: '#64748b',
    accentGrad: 'linear-gradient(135deg,#475569,#64748b)',
  },
};

const FALLBACK_VISUAL = {
  image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&q=80',
  overlay: 'from-slate-900/80 via-slate-700/40 to-transparent',
  accent: '#64748b',
  accentGrad: 'linear-gradient(135deg,#475569,#64748b)',
};

function getVisual(type: string) {
  return PROMO_VISUALS[type] ?? FALLBACK_VISUAL;
}

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------
const FILTER_TABS = [
  { key: 'active',   label: 'Active',   icon: <BoltIcon sx={{ fontSize: 14 }} /> },
  { key: 'upcoming', label: 'Upcoming', icon: <CalendarTodayIcon sx={{ fontSize: 14 }} /> },
  { key: 'expired',  label: 'Expired',  icon: <CloseIcon sx={{ fontSize: 14 }} /> },
];

// ---------------------------------------------------------------------------
// Eligibility badge
// ---------------------------------------------------------------------------
function EligibilityBadge({ eligibility }: { eligibility: string }) {
  if (eligibility === 'new')
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/30">
        <GroupIcon sx={{ fontSize: 10 }} /> New Users
      </span>
    );
  if (eligibility === 'vip')
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/30">
        <StarIcon sx={{ fontSize: 10 }} /> VIP
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/30">
      <GroupIcon sx={{ fontSize: 10 }} /> All Users
    </span>
  );
}

// ---------------------------------------------------------------------------
// Promo Card
// ---------------------------------------------------------------------------
function PromoCard({
  promo,
  claimed,
  onClick,
}: {
  promo: Promo;
  claimed: boolean;
  onClick: (promo: Promo) => void;
}) {
  const visual = getVisual(promo.type);

  return (
    <div
      onClick={() => onClick(promo)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 border border-slate-200/60 dark:border-slate-700/60"
    >
      {/* ── Image hero ── */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={visual.image}
          alt={promo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* colour-tinted overlay for branding */}
        <div className={`absolute inset-0 bg-gradient-to-t ${visual.overlay}`} />
        {/* universal dark bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

        {/* Type pill */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20">
            {promo.type.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Eligibility */}
        <div className="absolute top-3 right-3">
          <EligibilityBadge eligibility={promo.eligibility} />
        </div>

        {/* Claimed ribbon */}
        {claimed && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <span className="flex items-center gap-1.5 text-white font-bold text-sm bg-green-500 px-4 py-1.5 rounded-full shadow-lg">
              <CheckCircleIcon fontSize="small" /> Claimed
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
          {promo.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-3">
          {promo.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <CalendarTodayIcon sx={{ fontSize: 11 }} />
            Expires {promo.endDate}
          </span>

          {claimed ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-500">
              <CheckCircleIcon sx={{ fontSize: 14 }} /> Done
            </span>
          ) : (
            <span
              className="flex items-center gap-0.5 text-xs font-bold transition-all group-hover:gap-1.5"
              style={{ color: visual.accent }}
            >
              {promo.eligibility === 'new' ? 'Learn More' : 'Claim'}
              <ArrowForwardIcon sx={{ fontSize: 13 }} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
function PromoModal({
  promo,
  claimed,
  onClaim,
  onClose,
}: {
  promo: Promo;
  claimed: boolean;
  onClaim: (id: string) => void;
  onClose: () => void;
}) {
  const visual = getVisual(promo.type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up"
      >
        {/* Hero */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={visual.image}
            alt={promo.title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${visual.overlay}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm border border-white/20"
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>

          {/* Type + eligibility */}
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20">
              {promo.type.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="absolute top-4 right-14">
            <EligibilityBadge eligibility={promo.eligibility} />
          </div>

          {/* Title over image */}
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="font-bold text-xl text-white leading-snug drop-shadow-lg">
              {promo.title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
            {promo.description}
          </p>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Starts</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {(promo as any).startDate ?? '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Expires</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{promo.endDate}</p>
            </div>
          </div>

          {/* T&C */}
          <p className="text-[11px] text-slate-400 mb-5">
            T&Cs apply. Please gamble responsibly.{' '}
            <a href="#" className="underline hover:text-primary">Full terms →</a>
          </p>

          {/* CTA */}
          {claimed ? (
            <button
              disabled
              className="w-full py-3.5 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold text-sm flex items-center justify-center gap-2"
            >
              <CheckCircleIcon /> Already Claimed
            </button>
          ) : (
            <button
              onClick={() => { onClaim(promo.id); onClose(); }}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-lg"
              style={{ background: visual.accentGrad }}
            >
              {promo.eligibility === 'new' ? '→ Learn More' : '🎉 Claim Bonus'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(48px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.34,1.4,0.64,1) both; }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function PromosPage() {
  const [activeFilter, setActiveFilter] = useState('active');
  const [claimed, setClaimed]           = useState<Set<string>>(new Set());
  const [selected, setSelected]         = useState<Promo | null>(null);

  const filtered = promos.filter((p) => {
    if (activeFilter === 'active')   return p.active;
    if (activeFilter === 'upcoming') return !p.active && new Date((p as any).startDate) > new Date();
    return !p.active && new Date(p.endDate) < new Date();
  });

  const handleClaim = (id: string) =>
    setClaimed((prev) => new Set(prev).add(id));

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <LocalOfferIcon className="text-primary" sx={{ fontSize: 22 }} />
        </div>
        <div>
          <h1 className="font-bold text-xl text-slate-900 dark:text-slate-100 leading-none">Promotions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {filtered.length} offer{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              activeFilter === tab.key
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🎯</div>
          <p className="font-semibold text-slate-500 dark:text-slate-400">No promotions here</p>
          <p className="text-sm text-slate-400 mt-1">Check back soon for new offers</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              claimed={claimed.has(promo.id)}
              onClick={setSelected}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <PromoModal
          promo={selected}
          claimed={claimed.has(selected.id)}
          onClaim={handleClaim}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}