import { useState } from 'react';
import { promos } from '../data/mock';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const filterTabs = [
  { key: 'active', label: 'Active' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'expired', label: 'Expired' },
];

export default function PromosPage() {
  const [activeFilter, setActiveFilter] = useState('active');
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const filtered = promos.filter((p) => {
    if (activeFilter === 'active') return p.active;
    if (activeFilter === 'upcoming') return !p.active && new Date(p.startDate) > new Date();
    return !p.active && new Date(p.endDate) < new Date();
  });

  const handleClaim = (id: string) => {
    setClaimed((prev) => new Set(prev).add(id));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <LocalOfferIcon className="text-primary" fontSize="large" />
        <h1 className="font-heading text-2xl font-bold">Promotions</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((promo) => (
          <div key={promo.id} className="card p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="badge-red">{promo.type.replace(/_/g, ' ').toUpperCase()}</span>
              <span className="badge-gray">{promo.eligibility === 'all' ? 'All Users' : promo.eligibility === 'new' ? 'New Users' : 'VIP'}</span>
            </div>
            <h3 className="font-heading text-lg font-bold mb-2">{promo.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{promo.description}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
              <CalendarTodayIcon sx={{ fontSize: 12 }} />
              Expires: {promo.endDate}
            </div>
            {claimed.has(promo.id) ? (
              <button disabled className="w-full py-2.5 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-semibold flex items-center justify-center gap-1.5">
                <CheckCircleIcon fontSize="small" />
                Claimed
              </button>
            ) : (
              <button onClick={() => handleClaim(promo.id)} className="btn-primary w-full text-sm">
                {promo.eligibility === 'new' ? 'Learn More' : 'Claim'}
              </button>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <LocalOfferIcon fontSize="large" className="mx-auto mb-2" />
          <p>No promotions in this category</p>
        </div>
      )}
    </div>
  );
}
