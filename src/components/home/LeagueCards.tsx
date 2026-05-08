import StarIcon from '@mui/icons-material/Star';

const topLeagues = [
  {
    name: 'Premier League',
    flag: '🇬🇧',
    gradient: 'from-purple-700 to-purple-900',
    matches: 8,
    logo: 'https://pngdownload.io/wp-content/uploads/2023/12/Premier-League-Logo-PNG-Iconic-English-Football-Emblem-Transparent-jpg.webp',
  },
  {
    name: 'La Liga',
    flag: '🇪🇸',
    gradient: 'from-red-600 to-red-800',
    matches: 6,
    logo: 'https://www.freelogovectors.net/wp-content/uploads/2023/07/laliga-logo-freelogovectors.net_.png',
  },
  {
    name: 'Serie A',
    flag: '🇮🇹',
    gradient: 'from-green-700 to-emerald-900',
    matches: 5,
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa4X4Oa75oDFLlBG-SWbuHOEpXDsXgYfH-XA&s',
  },
  {
    name: 'Champions League',
    flag: '🇪🇺',
    gradient: 'from-blue-700 to-blue-900',
    matches: 4,
    logo: 'https://static.vecteezy.com/system/resources/thumbnails/010/994/351/small/champions-league-logo-symbol-blue-design-football-european-countries-football-teams-illustration-with-white-background-free-vector.jpg',
  },
];

export default function LeagueCards() {
  return (
    <div className="px-3 sm:px-4 mt-4 sm:mt-6">
      <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
        Top Leagues
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {topLeagues.map((league) => (
          <button
            key={league.name}
            className={`bg-gradient-to-br ${league.gradient} rounded-xl p-3 sm:p-4 text-white text-left hover:scale-[1.02] active:scale-[0.98] transition-transform touch-manipulation`}
          >
            <div className="flex items-center justify-between mb-3">
              {/* Solid white box so logo is always visible */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm">
                <img
                  src={league.logo}
                  alt={`${league.name} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl">${league.flag}</span>`;
                  }}
                />
              </div>
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