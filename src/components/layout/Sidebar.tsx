import { Link, useLocation } from 'react-router-dom';
import { leagues } from '../../data/mock';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import SportsRugbyIcon from '@mui/icons-material/SportsRugby';

const otherSports = [
  { name: 'Basketball', icon: <SportsBasketballIcon fontSize="small" /> },
  { name: 'Tennis', icon: <SportsTennisIcon fontSize="small" /> },
  { name: 'Cricket', icon: <SportsCricketIcon fontSize="small" /> },
  { name: 'Rugby', icon: <SportsRugbyIcon fontSize="small" /> },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:block w-60 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4">
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Top Leagues
        </h3>
        <nav className="flex flex-col gap-0.5">
          {leagues.map((league) => (
            <Link
              key={league.name}
              to="/"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === '/'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{league.flag}</span>
              <span>{league.name}</span>
            </Link>
          ))}
        </nav>

        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-6 mb-3">
          Other Sports
        </h3>
        <nav className="flex flex-col gap-0.5">
          {otherSports.map((sport) => (
            <Link
              key={sport.name}
              to="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <SportsSoccerIcon fontSize="small" className="text-slate-400" />
              {sport.icon}
              <span>{sport.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
