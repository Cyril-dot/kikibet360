import { useState } from 'react';
import { casinoGames } from '../data/mock';
import CasinoIcon from '@mui/icons-material/Casino';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'slots', label: 'Slots' },
  { key: 'table', label: 'Table Games' },
  { key: 'live', label: 'Live Casino' },
  { key: 'crash', label: 'Crash Games' },
  { key: 'virtual', label: 'Virtual Sports' },
];

export default function CasinoPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [gameModal, setGameModal] = useState<string | null>(null);

  const filtered = activeCategory === 'all'
    ? casinoGames
    : casinoGames.filter((g) => g.category === activeCategory);

  const selectedGame = gameModal ? casinoGames.find((g) => g.id === gameModal) : null;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <CasinoIcon className="text-primary" fontSize="large" />
        <h1 className="font-heading text-2xl font-bold">Casino</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {filtered.map((game) => (
          <button
            key={game.id}
            onClick={() => setGameModal(game.id)}
            className="card overflow-hidden hover:shadow-md transition-shadow text-left group"
          >
            <div className={`bg-gradient-to-br ${game.gradient} p-6 flex items-center justify-center relative`}>
              <CasinoIcon className="text-white/30" sx={{ fontSize: 48 }} />
              {game.hot && (
                <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  <LocalFireDepartmentIcon sx={{ fontSize: 12 }} />
                  HOT
                </span>
              )}
              {game.jackpot && (
                <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  <StarIcon sx={{ fontSize: 12 }} />
                  JACKPOT
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold truncate">{game.name}</h3>
              <p className="text-xs text-slate-500">{game.provider}</p>
              <span className="mt-2 inline-block text-xs font-semibold text-primary">Play Now</span>
            </div>
          </button>
        ))}
      </div>

      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setGameModal(null)}>
          <div className="card m-4 max-w-lg w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-heading text-lg font-bold">{selectedGame.name}</h3>
                <p className="text-sm text-slate-500">{selectedGame.provider}</p>
              </div>
              <button onClick={() => setGameModal(null)}><CloseIcon /></button>
            </div>
            <div className="p-6">
              <div className={`bg-gradient-to-br ${selectedGame.gradient} rounded-xl h-64 flex items-center justify-center`}>
                <div className="text-center text-white">
                  <CasinoIcon sx={{ fontSize: 48 }} className="mb-2 opacity-50" />
                  <p className="font-medium">Game Loading...</p>
                  <p className="text-sm opacity-70 mt-1">Please wait while the game loads</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setGameModal(null)} className="btn-primary w-full">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
