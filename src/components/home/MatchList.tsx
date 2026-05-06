import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { matches } from '../../data/mock';
import type { Match } from '../../types';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ScheduleIcon from '@mui/icons-material/Schedule';

function MatchRow({ match }: { match: Match }) {
  const navigate = useNavigate();
  const { betSlip, addToBetSlip, showToast } = useAppStore();

  const isSelected = (market: string, selection: string) =>
    betSlip.some((s) => s.matchId === match.id && s.market === market && s.selection === selection);

  const handleOddClick = (e: React.MouseEvent, market: string, selection: string, odd: number) => {
    e.stopPropagation();
    addToBetSlip({
      matchId: match.id,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      market,
      selection,
      odd,
    });
    showToast('Added to bet slip', 'success');
  };

  return (
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">{match.leagueFlag} {match.league}</span>
          {match.status === 'live' && (
            <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
              <FiberManualRecordIcon sx={{ fontSize: 8 }} className="animate-pulse-green" />
              {match.minute}'
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{match.homeTeam}</span>
          {match.status === 'live' && match.homeScore !== null ? (
            <span className="text-sm font-bold text-primary">{match.homeScore}</span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <ScheduleIcon sx={{ fontSize: 12 }} />
              {match.time}
            </span>
          )}
          <span className="text-xs text-slate-400">vs</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{match.awayTeam}</span>
          {match.status === 'live' && match.awayScore !== null && (
            <span className="text-sm font-bold text-primary">{match.awayScore}</span>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0 ml-2">
        <button
          onClick={(e) => handleOddClick(e, '1X2', '1', match.odds.home)}
          className={`odd-btn ${isSelected('1X2', '1') ? 'odd-btn-selected' : ''}`}
        >
          {match.odds.home.toFixed(2)}
        </button>
        <button
          onClick={(e) => handleOddClick(e, '1X2', 'X', match.odds.draw)}
          className={`odd-btn ${isSelected('1X2', 'X') ? 'odd-btn-selected' : ''}`}
        >
          {match.odds.draw.toFixed(2)}
        </button>
        <button
          onClick={(e) => handleOddClick(e, '1X2', '2', match.odds.away)}
          className={`odd-btn ${isSelected('1X2', '2') ? 'odd-btn-selected' : ''}`}
        >
          {match.odds.away.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

export default function MatchList() {
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const groupedByLeague = upcomingMatches.reduce<Record<string, Match[]>>((acc, match) => {
    if (!acc[match.league]) acc[match.league] = [];
    acc[match.league].push(match);
    return acc;
  }, {});

  return (
    <div className="px-4 mt-6">
      <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Upcoming Matches</h2>
      {Object.entries(groupedByLeague).map(([league, leagueMatches]) => (
        <div key={league} className="card mb-3 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {leagueMatches[0].leagueFlag} {league}
            </span>
          </div>
          {leagueMatches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      ))}
    </div>
  );
}
