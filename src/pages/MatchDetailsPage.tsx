import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { matches } from '../data/mock';
import { useAppStore } from '../store';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import SportsIcon from '@mui/icons-material/Sports';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';

export default function MatchDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { betSlip, addToBetSlip, showToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'markets' | 'stats' | 'h2h' | 'lineups'>('markets');

  const match = matches.find((m) => m.id === id);
  if (!match) return <div className="p-8 text-center">Match not found</div>;

  const isSelected = (market: string, selection: string) =>
    betSlip.some((s) => s.matchId === match.id && s.market === market && s.selection === selection);

  const handleOddClick = (market: string, selection: string, odd: number) => {
    addToBetSlip({
      matchId: match.id,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      market,
      selection,
      odd,
    });
    showToast('Added to bet slip', 'success');
  };

  const tabs = [
    { key: 'markets' as const, label: 'Markets', icon: <SportsIcon fontSize="small" /> },
    { key: 'stats' as const, label: 'Stats', icon: <BarChartIcon fontSize="small" /> },
    { key: 'h2h' as const, label: 'H2H', icon: <PeopleIcon fontSize="small" /> },
    { key: 'lineups' as const, label: 'Lineups', icon: <PeopleIcon fontSize="small" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 mb-4 transition-colors">
          <ArrowBackIcon fontSize="small" />
          Back
        </button>

        <div className="card p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">{match.leagueFlag}</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{match.league}</span>
            {match.status === 'live' && (
              <span className="flex items-center gap-1 text-xs text-green-500 font-semibold ml-2">
                <FiberManualRecordIcon sx={{ fontSize: 8 }} className="animate-pulse-green" />
                LIVE {match.minute}'
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center flex-1">
              <h2 className="font-heading text-xl md:text-2xl font-bold">{match.homeTeam}</h2>
            </div>
            <div className="text-center px-4">
              {match.status === 'live' || match.status === 'finished' ? (
                <div className="font-heading text-3xl md:text-4xl font-bold text-primary">
                  {match.homeScore} - {match.awayScore}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-400">
                  <ScheduleIcon />
                  <span className="text-lg font-semibold">{match.time}</span>
                </div>
              )}
            </div>
            <div className="text-center flex-1">
              <h2 className="font-heading text-xl md:text-2xl font-bold">{match.awayTeam}</h2>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><CalendarTodayIcon sx={{ fontSize: 14 }} /> {match.date}</span>
            <span className="flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 14 }} /> {match.venue}</span>
            <span className="flex items-center gap-1"><PersonIcon sx={{ fontSize: 14 }} /> {match.referee}</span>
          </div>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'markets' && (
          <div className="space-y-3">
            {match.markets.map((market) => (
              <div key={market.name} className="card p-4">
                <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">{market.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {market.options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleOddClick(market.name, opt.label, opt.odd)}
                      className={`odd-btn flex items-center gap-2 ${isSelected(market.name, opt.label) ? 'odd-btn-selected' : ''}`}
                    >
                      <span className="text-xs">{opt.label}</span>
                      <span className="font-bold">{opt.odd.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stats' && match.stats && (
          <div className="card p-4 space-y-4">
            {Object.entries(match.stats).map(([key, values]) => {
              const [home, away] = values as [number, number];
              const total = home + away || 1;
              const labels: Record<string, string> = {
                possession: 'Possession',
                shots: 'Shots',
                shotsOnTarget: 'Shots on Target',
                corners: 'Corners',
                fouls: 'Fouls',
                yellowCards: 'Yellow Cards',
                redCards: 'Red Cards',
              };
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{home}{key === 'possession' ? '%' : ''}</span>
                    <span className="text-slate-500 dark:text-slate-400">{labels[key]}</span>
                    <span className="font-semibold">{away}{key === 'possession' ? '%' : ''}</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <div className="bg-primary rounded-l-full transition-all" style={{ width: `${(home / total) * 100}%` }} />
                    <div className="bg-blue-500 rounded-r-full transition-all" style={{ width: `${(away / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'h2h' && (
          <div className="card p-4">
            {match.h2h && match.h2h.length > 0 ? (
              <div className="space-y-3">
                {match.h2h.map((game, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="text-sm">
                      <span className="text-slate-500 dark:text-slate-400">{game.date}</span>
                      <p className="font-medium">{game.homeTeam} vs {game.awayTeam}</p>
                    </div>
                    <span className="font-bold text-primary">{game.homeScore} - {game.awayScore}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-slate-400 py-4">No head-to-head data available</p>
            )}
          </div>
        )}

        {activeTab === 'lineups' && match.lineups && (
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="font-heading text-sm font-bold text-primary mb-3">{match.homeTeam}</h3>
              <div className="space-y-1.5">
                {match.lineups.home.map((player, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-xs text-slate-400">{i + 1}</span>
                    <span>{player}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <h3 className="font-heading text-sm font-bold text-blue-500 mb-3">{match.awayTeam}</h3>
              <div className="space-y-1.5">
                {match.lineups.away.map((player, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-xs text-slate-400">{i + 1}</span>
                    <span>{player}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
