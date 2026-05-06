import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matches } from '../data/mock';
import { useAppStore } from '../store';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'football', label: 'Football', icon: <SportsSoccerIcon fontSize="small" /> },
  { key: 'basketball', label: 'Basketball', icon: <SportsBasketballIcon fontSize="small" /> },
  { key: 'tennis', label: 'Tennis', icon: <SportsTennisIcon fontSize="small" /> },
];

export default function LiveMatchesPage() {
  const navigate = useNavigate();
  const { betSlip, addToBetSlip, showToast } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [liveMatches, setLiveMatches] = useState(matches.filter((m) => m.status === 'live'));

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMatches((prev) =>
        prev.map((m) => ({
          ...m,
          minute: Math.min((m.minute || 0) + 1, 90),
          homeScore: m.homeScore ?? 0,
          awayScore: m.awayScore ?? 0,
        }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isSelected = (matchId: string, market: string, selection: string) =>
    betSlip.some((s) => s.matchId === matchId && s.market === market && s.selection === selection);

  const handleOddClick = (e: React.MouseEvent, matchId: string, matchName: string, market: string, selection: string, odd: number) => {
    e.stopPropagation();
    addToBetSlip({ matchId, matchName, market, selection, odd });
    showToast('Added to bet slip', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <LiveTvIcon className="text-green-500" fontSize="large" />
        <h1 className="font-heading text-2xl font-bold">Live Now</h1>
        <span className="badge-green">{liveMatches.length} events</span>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {liveMatches.map((match) => (
          <div
            key={match.id}
            onClick={() => navigate(`/match/${match.id}`)}
            className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">{match.leagueFlag} {match.league}</span>
              <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                <FiberManualRecordIcon sx={{ fontSize: 8 }} className="animate-pulse-green" />
                {match.minute}'
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{match.homeTeam}</span>
              <span className="font-heading text-2xl font-bold text-primary">
                {match.homeScore} - {match.awayScore}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{match.awayTeam}</span>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={(e) => handleOddClick(e, match.id, `${match.homeTeam} vs ${match.awayTeam}`, '1X2', '1', match.odds.home)}
                className={`odd-btn ${isSelected(match.id, '1X2', '1') ? 'odd-btn-selected' : ''}`}
              >
                1 {match.odds.home.toFixed(2)}
              </button>
              <button
                onClick={(e) => handleOddClick(e, match.id, `${match.homeTeam} vs ${match.awayTeam}`, '1X2', 'X', match.odds.draw)}
                className={`odd-btn ${isSelected(match.id, '1X2', 'X') ? 'odd-btn-selected' : ''}`}
              >
                X {match.odds.draw.toFixed(2)}
              </button>
              <button
                onClick={(e) => handleOddClick(e, match.id, `${match.homeTeam} vs ${match.awayTeam}`, '1X2', '2', match.odds.away)}
                className={`odd-btn ${isSelected(match.id, '1X2', '2') ? 'odd-btn-selected' : ''}`}
              >
                2 {match.odds.away.toFixed(2)}
              </button>
            </div>
          </div>
        ))}

        {liveMatches.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <LiveTvIcon fontSize="large" className="mx-auto mb-2" />
            <p>No live matches right now</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
