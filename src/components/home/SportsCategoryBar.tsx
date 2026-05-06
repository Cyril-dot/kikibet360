import { useState } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import SportsRugbyIcon from '@mui/icons-material/SportsRugby';
import { leagues } from '../../data/mock';

const sports = [
  { name: 'Football', icon: <SportsSoccerIcon fontSize="small" /> },
  { name: 'Basketball', icon: <SportsBasketballIcon fontSize="small" /> },
  { name: 'Tennis', icon: <SportsTennisIcon fontSize="small" /> },
  { name: 'Cricket', icon: <SportsCricketIcon fontSize="small" /> },
  { name: 'Rugby', icon: <SportsRugbyIcon fontSize="small" /> },
];

export default function SportsCategoryBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSport, setActiveSport] = useState('Football');

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {sports.map((sport) => (
          <button
            key={sport.name}
            onClick={() => setActiveSport(sport.name)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              activeSport === sport.name
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {sport.icon}
            {sport.name}
          </button>
        ))}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
        >
          Leagues
          {dropdownOpen ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </button>
      </div>

      {dropdownOpen && (
        <div className="px-4 pb-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-1">
            {leagues.map((league) => (
              <button
                key={league.name}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <span>{league.flag}</span>
                <span className="truncate">{league.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
