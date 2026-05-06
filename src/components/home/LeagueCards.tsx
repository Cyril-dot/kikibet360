import StarIcon from '@mui/icons-material/Star';

const topLeagues = [
  { name: 'Premier League', flag: '\u{1F1EC}\u{1F1E7}', gradient: 'from-purple-700 to-purple-900', matches: 8 },
  { name: 'La Liga', flag: '\u{1F1EA}\u{1F1F8}', gradient: 'from-red-600 to-red-800', matches: 6 },
  { name: 'Serie A', flag: '\u{1F1EE}\u{1F1F9}', gradient: 'from-green-700 to-emerald-900', matches: 5 },
  { name: 'Champions League', flag: '\u{1F1EA}\u{1F1FA}', gradient: 'from-blue-700 to-blue-900', matches: 4 },
];

export default function LeagueCards() {
  return (
    <div className="px-4 mt-6">
      <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Top Leagues</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {topLeagues.map((league) => (
          <button
            key={league.name}
            className={`bg-gradient-to-br ${league.gradient} rounded-xl p-4 text-white text-left hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{league.flag}</span>
              <StarIcon className="text-yellow-400" fontSize="small" />
            </div>
            <h3 className="font-heading text-sm font-bold leading-tight">{league.name}</h3>
            <p className="text-xs opacity-80 mt-1">{league.matches} matches today</p>
          </button>
        ))}
      </div>
    </div>
  );
}
