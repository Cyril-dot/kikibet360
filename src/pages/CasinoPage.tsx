import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Google Material Icons (via @mui/icons-material) ──────────────────────────
import CasinoIcon from '@mui/icons-material/Casino';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DiamondIcon from '@mui/icons-material/Diamond';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FilterListIcon from '@mui/icons-material/FilterList';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CasinoGame {
  slug: string;
  name: string;
  provider: string;
  family: string;
  maxPayout: string;
  minBet: string;
  desc: string;
  longDesc: string;
  accentColor: string;
  bgColor: string;
  hot: boolean;
  pslTag: string;
  Icon: React.ElementType;
  ArtComponent: React.FC;
}

// ── Custom SVG Art Components ──────────────────────────────────────────────────

const AviatorArt: React.FC = () => (
  <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="aviatorSky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f0c29" />
        <stop offset="50%" stopColor="#302b63" />
        <stop offset="100%" stopColor="#24243e" />
      </linearGradient>
      <linearGradient id="planeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ff6b35" stopOpacity="0" />
        <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.8" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="6" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <rect width="320" height="180" fill="url(#aviatorSky)" />

    {[[30,20],[80,15],[150,25],[200,10],[260,30],[290,18],[45,55],[130,45],[240,50],[310,40],[15,80],[95,75],[175,65],[280,70]].map(([cx,cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 1.5 : 1} fill="white" opacity={0.7} />
    ))}

    <path d="M 20 150 Q 80 140 120 110 Q 160 80 180 60 Q 200 40 215 25" stroke="#ff4d4d" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#glow)" />
    <circle cx="215" cy="25" r="6" fill="#ff4d4d" filter="url(#softGlow)" opacity="0.9" />
    <rect x="220" y="15" width="58" height="20" rx="10" fill="#ff4d4d" opacity="0.9" />
    <text x="249" y="28" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">1000x</text>

    <g transform="translate(170, 68) rotate(-25)" filter="url(#glow)">
      <ellipse cx="0" cy="0" rx="22" ry="7" fill="#e8e8e8" />
      <path d="M 18 0 L 28 0 L 22 4 Z" fill="#cccccc" />
      <path d="M -18 -3 L -24 -16 L -14 -3 Z" fill="#cccccc" />
      <path d="M -18 3 L -24 12 L -14 3 Z" fill="#cccccc" />
      <path d="M -5 -5 L 8 -5 L 5 -18 L -8 -14 Z" fill="#d4d4d4" />
      <path d="M -5 5 L 8 5 L 5 18 L -8 14 Z" fill="#d4d4d4" />
      <ellipse cx="-20" cy="0" rx="5" ry="3" fill="#ff6b35" opacity="0.9" />
      <ellipse cx="-26" cy="0" rx="8" ry="4" fill="#ff4d00" opacity="0.5" />
    </g>

    <path d="M 145 88 Q 130 90 100 88 Q 80 87 60 89" stroke="url(#planeGlow)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6" />
    <path d="M 145 88 Q 130 91 105 90 Q 85 89 65 91" stroke="#ff9966" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />

    {[60,90,120,150].map((y, i) => (
      <line key={i} x1="20" y1={y} x2="300" y2={y} stroke="white" strokeWidth="0.3" opacity="0.1" />
    ))}
    {[60,120,180,240,300].map((x, i) => (
      <line key={i} x1={x} y1="30" x2={x} y2="160" stroke="white" strokeWidth="0.3" opacity="0.1" />
    ))}

    <rect x="0" y="155" width="320" height="25" fill="black" opacity="0.4" />
    <text x="160" y="171" textAnchor="middle" fill="#ff6b35" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="3">AVIATOR</text>
  </svg>
);

const SportyJetArt: React.FC = () => (
  <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="spaceGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0a0010" />
        <stop offset="50%" stopColor="#1a0533" />
        <stop offset="100%" stopColor="#0d1b4b" />
      </linearGradient>
      <radialGradient id="engineBlast" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#00d4ff" />
        <stop offset="70%" stopColor="#7b2ff7" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#7b2ff7" stopOpacity="0" />
      </radialGradient>
      <filter id="rocketGlow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7b2ff7" stopOpacity="0" />
        <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.7" />
      </linearGradient>
    </defs>

    <rect width="320" height="180" fill="url(#spaceGrad)" />

    {[[20,15],[70,8],[140,20],[210,5],[275,25],[300,12],[50,45],[120,38],[230,42],[285,55],[10,70],[100,65],[190,60],[270,68],[35,95],[160,90],[300,85]].map(([cx,cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2 : 1} fill="white" opacity={0.4 + (i%5)*0.1} />
    ))}

    <circle cx="260" cy="40" r="30" fill="#1e0047" opacity="0.8" />
    <circle cx="260" cy="40" r="30" fill="none" stroke="#7b2ff7" strokeWidth="1" opacity="0.4" />
    <ellipse cx="260" cy="40" rx="42" ry="10" fill="none" stroke="#7b2ff7" strokeWidth="1.5" opacity="0.5" />

    {([[0,80,100,80],[0,95,80,95],[0,110,120,110],[10,70,90,70]] as number[][]).map(([x1,y1,x2,y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#streakGrad)" strokeWidth={i===2?2:1} opacity="0.5" />
    ))}

    <g transform="translate(170, 88) rotate(-30)" filter="url(#rocketGlow)">
      <rect x="-8" y="-25" width="16" height="40" rx="8" fill="#e0e0ff" />
      <path d="M -8 -25 Q 0 -42 8 -25 Z" fill="#c0c0e0" />
      <path d="M -8 12 L -18 22 L -8 20 Z" fill="#9999cc" />
      <path d="M 8 12 L 18 22 L 8 20 Z" fill="#9999cc" />
      <circle cx="0" cy="-10" r="5" fill="#00d4ff" opacity="0.8" />
      <circle cx="0" cy="-10" r="3" fill="white" opacity="0.9" />
      <rect x="-5" y="14" width="10" height="6" rx="2" fill="#888" />
    </g>

    <ellipse cx="148" cy="108" rx="18" ry="10" fill="url(#engineBlast)" opacity="0.9" transform="rotate(-30, 148, 108)" />
    <ellipse cx="138" cy="115" rx="28" ry="12" fill="url(#engineBlast)" opacity="0.5" transform="rotate(-30, 138, 115)" />

    <rect x="195" y="48" width="55" height="20" rx="10" fill="#7b2ff7" opacity="0.95" />
    <text x="222" y="61" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">750x</text>

    <rect x="0" y="155" width="320" height="25" fill="black" opacity="0.4" />
    <text x="160" y="171" textAnchor="middle" fill="#00d4ff" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="2">SPORTY JET</text>
  </svg>
);

const MinesArt: React.FC = () => (
  <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="minesBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0d1f0d" />
        <stop offset="50%" stopColor="#0a1a0a" />
        <stop offset="100%" stopColor="#071507" />
      </linearGradient>
      <radialGradient id="gemGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00ff88" />
        <stop offset="100%" stopColor="#00aa44" stopOpacity="0" />
      </radialGradient>
      <filter id="gemLight">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="bombGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <rect width="320" height="180" fill="url(#minesBg)" />

    {(() => {
      const cells: React.ReactNode[] = [];
      const revealed = [
        {col:0,row:0,type:'gem'},{col:1,row:0,type:'gem'},{col:2,row:0,type:'safe'},{col:3,row:0,type:'gem'},{col:4,row:0,type:'safe'},
        {col:0,row:1,type:'gem'},{col:1,row:1,type:'bomb'},{col:2,row:1,type:'gem'},{col:3,row:1,type:'safe'},{col:4,row:1,type:'gem'},
        {col:0,row:2,type:'safe'},{col:1,row:2,type:'gem'},{col:2,row:2,type:'gem'},{col:3,row:2,type:'bomb'},{col:4,row:2,type:'safe'},
        {col:0,row:3,type:'hidden'},{col:1,row:3,type:'hidden'},{col:2,row:3,type:'hidden'},{col:3,row:3,type:'hidden'},{col:4,row:3,type:'hidden'},
      ];
      const startX = 22, startY = 22, cellSize = 52, gap = 4;

      revealed.forEach(({ col, row, type }) => {
        const x = startX + col * (cellSize + gap);
        const y = startY + row * (cellSize + gap);
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;

        if (type === 'hidden') {
          cells.push(<rect key={`${col}-${row}`} x={x} y={y} width={cellSize} height={cellSize} rx="6" fill="#1a2e1a" stroke="#2d4a2d" strokeWidth="1" />);
        } else if (type === 'gem') {
          cells.push(
            <g key={`${col}-${row}`} filter="url(#gemLight)">
              <rect x={x} y={y} width={cellSize} height={cellSize} rx="6" fill="#0d2b18" stroke="#00cc66" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="14" fill="url(#gemGlow)" opacity="0.3" />
              <polygon points={`${cx},${cy-14} ${cx+12},${cy-2} ${cx+8},${cy+12} ${cx-8},${cy+12} ${cx-12},${cy-2}`} fill="#00ff88" opacity="0.9" />
              <polygon points={`${cx},${cy-14} ${cx+12},${cy-2} ${cx},${cy} ${cx-12},${cy-2}`} fill="white" opacity="0.3" />
            </g>
          );
        } else if (type === 'bomb') {
          cells.push(
            <g key={`${col}-${row}`} filter="url(#bombGlow)">
              <rect x={x} y={y} width={cellSize} height={cellSize} rx="6" fill="#2b0a0a" stroke="#ff3333" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="13" fill="#cc0000" />
              <circle cx={cx} cy={cy} r="13" fill="none" stroke="#ff6666" strokeWidth="1" opacity="0.5" />
              {[0,45,90,135,180,225,270,315].map((angle, i) => {
                const rad = angle * Math.PI / 180;
                return <line key={i} x1={cx + Math.cos(rad)*8} y1={cy + Math.sin(rad)*8} x2={cx + Math.cos(rad)*16} y2={cy + Math.sin(rad)*16} stroke="#ff4444" strokeWidth="2" strokeLinecap="round" />;
              })}
              <circle cx={cx - 4} cy={cy - 4} r="3" fill="white" opacity="0.4" />
            </g>
          );
        } else {
          cells.push(<rect key={`${col}-${row}`} x={x} y={y} width={cellSize} height={cellSize} rx="6" fill="#122012" stroke="#1e3a1e" strokeWidth="1" />);
        }
      });
      return cells;
    })()}

    <rect x="228" y="10" width="78" height="24" rx="12" fill="#00cc66" opacity="0.95" />
    <text x="267" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">1000x MAX</text>

    <rect x="0" y="155" width="320" height="25" fill="black" opacity="0.4" />
    <text x="160" y="171" textAnchor="middle" fill="#00ff88" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="4">MINES</text>
  </svg>
);

const VirtualFootballArt: React.FC = () => (
  <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1a4a1a" />
        <stop offset="50%" stopColor="#1f5c1f" />
        <stop offset="100%" stopColor="#1a4a1a" />
      </linearGradient>
      <filter id="ballGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <rect width="320" height="180" fill="url(#pitchGrad)" />
    {[0,64,128,192,256].map((x, i) => (
      <rect key={i} x={x} y="0" width="32" height="180" fill="white" opacity="0.03" />
    ))}

    <rect x="12" y="12" width="296" height="156" rx="2" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
    <line x1="160" y1="12" x2="160" y2="168" stroke="white" strokeWidth="1.5" opacity="0.7" />
    <circle cx="160" cy="90" r="32" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
    <circle cx="160" cy="90" r="3" fill="white" opacity="0.7" />

    <rect x="12" y="52" width="54" height="76" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
    <rect x="12" y="68" width="24" height="44" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
    <circle cx="50" cy="90" r="2.5" fill="white" opacity="0.7" />
    <path d="M 66 70 Q 82 90 66 110" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />

    <rect x="254" y="52" width="54" height="76" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
    <rect x="284" y="68" width="24" height="44" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
    <circle cx="270" cy="90" r="2.5" fill="white" opacity="0.7" />
    <path d="M 254 70 Q 238 90 254 110" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />

    <rect x="0" y="70" width="12" height="40" fill="none" stroke="white" strokeWidth="2" opacity="0.9" />
    <rect x="308" y="70" width="12" height="40" fill="none" stroke="white" strokeWidth="2" opacity="0.9" />

    <path d="M 12 24 Q 24 24 24 12" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
    <path d="M 296 24 Q 296 12 308 12" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
    <path d="M 12 156 Q 24 156 24 168" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
    <path d="M 296 156 Q 296 168 308 168" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />

    <g filter="url(#ballGlow)">
      <circle cx="160" cy="90" r="14" fill="white" />
      <polygon points="160,78 167,83 164,91 156,91 153,83" fill="#1a1a1a" opacity="0.85" />
      <polygon points="160,78 167,83 175,80 174,72 165,70" fill="#1a1a1a" opacity="0.6" />
      <polygon points="153,83 156,91 149,96 142,91 143,83" fill="#1a1a1a" opacity="0.6" />
      <polygon points="164,91 156,91 154,100 160,104 167,100" fill="#1a1a1a" opacity="0.6" />
      <ellipse cx="155" cy="82" rx="5" ry="3" fill="white" opacity="0.5" transform="rotate(-20,155,82)" />
    </g>

    {[[90,60],[80,90],[90,120],[120,75],[120,105],[140,90]].map(([px,py],i) => (
      <g key={`a${i}`}>
        <circle cx={px} cy={py} r="7" fill="#00cc44" stroke="white" strokeWidth="1.5" opacity="0.9" />
        <text x={px} y={py+1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="bold">{i+1}</text>
      </g>
    ))}
    {[[230,60],[240,90],[230,120],[200,75],[200,105],[180,90]].map(([px,py],i) => (
      <g key={`b${i}`}>
        <circle cx={px} cy={py} r="7" fill="#cc2200" stroke="white" strokeWidth="1.5" opacity="0.9" />
        <text x={px} y={py+1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="bold">{i+1}</text>
      </g>
    ))}

    <rect x="120" y="6" width="80" height="22" rx="11" fill="black" opacity="0.65" />
    <text x="160" y="21" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">2 – 1</text>

    <rect x="0" y="155" width="320" height="25" fill="black" opacity="0.4" />
    <text x="160" y="171" textAnchor="middle" fill="#44ff88" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="2">VIRTUAL FOOTBALL</text>
  </svg>
);

// ── Game catalogue ─────────────────────────────────────────────────────────────
const casinoGames: CasinoGame[] = [
  {
    slug: 'aviator',
    name: 'Aviator',
    provider: 'Spribe',
    family: 'crash',
    maxPayout: '1000x',
    minBet: 'GH₵5',
    desc: 'Cash out before the multiplier crashes. Hold your nerve for massive rewards.',
    longDesc: 'Aviator is the world\'s most iconic crash game. Watch the multiplier climb — from 1x to 1000x. The longer you wait, the more you win. But if you don\'t cash out in time, you lose it all. Pure adrenaline, every round.',
    accentColor: '#ff6b35',
    bgColor: '#1a0808',
    hot: true,
    pslTag: 'PSL Season 10',
    Icon: FlightTakeoffIcon,
    ArtComponent: AviatorArt,
  },
  {
    slug: 'sporty-jet',
    name: 'Sporty Jet',
    provider: 'In-House',
    family: 'crash',
    maxPayout: '750x',
    minBet: 'GH₵5',
    desc: 'A high-speed space crash game with multipliers launching beyond the stratosphere.',
    longDesc: 'Sporty Jet takes crash games to the cosmos. Ride the rocket as it blasts through space — time your cashout perfectly and walk away with up to 750x your stake. Lightning-fast rounds mean no downtime, only action.',
    accentColor: '#7b2ff7',
    bgColor: '#0d0020',
    hot: true,
    pslTag: 'PSL Season 10',
    Icon: RocketLaunchIcon,
    ArtComponent: SportyJetArt,
  },
  {
    slug: 'mines',
    name: 'Mines',
    provider: 'In-House',
    family: 'skill',
    maxPayout: '1000x',
    minBet: 'GH₵10',
    desc: 'Reveal gems across the grid. One wrong move and the bomb ends it all.',
    longDesc: 'Mines is the ultimate game of nerves. A 5×5 grid hides gems and bombs — reveal gems to grow your multiplier, but detonate a mine and you lose your stake. You control the risk: choose how many mines are on the board before each round.',
    accentColor: '#00ff88',
    bgColor: '#041a0a',
    hot: false,
    pslTag: 'PSL Season 10',
    Icon: DiamondIcon,
    ArtComponent: MinesArt,
  },
  {
    slug: 'virtual-football',
    name: 'Virtual Football',
    provider: 'In-House',
    family: 'virtual',
    maxPayout: '200x',
    minBet: 'GH₵10',
    desc: 'Bet on realistic virtual PSL-style football matches running 24/7.',
    longDesc: 'Virtual Football brings the excitement of PSL-style football to your fingertips — 24 hours a day, 7 days a week. Predict match outcomes, scorelines, and top scorers in AI-powered matches with real football physics and realistic team stats.',
    accentColor: '#44dd88',
    bgColor: '#041204',
    hot: false,
    pslTag: 'PSL Season 10',
    Icon: SportsSoccerIcon,
    ArtComponent: VirtualFootballArt,
  },
];

const categories = [
  { key: 'all',     label: 'All Games' },
  { key: 'crash',   label: 'Crash' },
  { key: 'skill',   label: 'Skill' },
  { key: 'virtual', label: 'Virtual' },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CasinoPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [preview, setPreview] = useState<CasinoGame | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  const filtered =
    activeCategory === 'all'
      ? casinoGames
      : casinoGames.filter((g) => g.family === activeCategory);

  const handleNotify = (slug: string) => {
    setNotified(prev => new Set([...prev, slug]));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <CasinoIcon className="text-white" fontSize="medium" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold leading-tight">Casino</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">4 upcoming PSL games</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 px-3 py-1.5 rounded-full">
          <EmojiEventsIcon className="text-yellow-500" sx={{ fontSize: 16 }} />
          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">PSL Season 10</span>
        </div>
      </div>

      {/* ── PSL upcoming banner ── */}
      <div className="relative mb-6 rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-5">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)' }} />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-xl">
            <EmojiEventsIcon className="text-white" fontSize="medium" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Upcoming</span>
              <div className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-xs text-slate-400">Pakistan Super League</span>
            </div>
            <h2 className="text-white font-bold text-base leading-snug">
              PSL Season 10 Casino Games are almost here 🎰
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All 4 games coming soon. Notify yourself to be first in line.
            </p>
          </div>
          <div className="flex-shrink-0 hidden sm:flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full">
            <AccessTimeIcon sx={{ fontSize: 14 }} className="text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide">
        <FilterListIcon className="text-slate-400 flex-shrink-0" sx={{ fontSize: 18 }} />
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.key
                ? 'bg-primary text-white shadow-md scale-105'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
            {cat.key === 'all' && (
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeCategory === 'all' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {casinoGames.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Game grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CasinoIcon sx={{ fontSize: 48 }} className="mb-3 opacity-30" />
          <p>No games in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((game) => {
            const isNotified = notified.has(game.slug);
            return (
              <button
                key={game.slug}
                onClick={() => setPreview(game)}
                className="card overflow-hidden hover:shadow-xl transition-all hover:-translate-y-0.5 text-left group relative"
              >
                {/* Game Art */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <game.ArtComponent />

                  {/* Overlay badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                      <EmojiEventsIcon sx={{ fontSize: 10 }} />
                      {game.pslTag}
                    </span>
                    <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                      <AccessTimeIcon sx={{ fontSize: 10 }} />
                      Upcoming
                    </span>
                  </div>

                  {/* Hot badge */}
                  {game.hot && (
                    <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                      <LocalFireDepartmentIcon sx={{ fontSize: 11 }} />
                      HOT
                    </span>
                  )}

                  {/* Notified overlay */}
                  {isNotified && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <NotificationsActiveIcon sx={{ fontSize: 14 }} />
                        Notified!
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: game.accentColor + '22', border: `1px solid ${game.accentColor}44` }}>
                      <game.Icon sx={{ fontSize: 18, color: game.accentColor }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold truncate">{game.name}</h3>
                      <p className="text-[11px] text-slate-400 truncate">{game.provider} · Max {game.maxPayout}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className="text-[11px] font-semibold text-primary">View</span>
                    <ArrowForwardIcon sx={{ fontSize: 14 }} className="text-primary" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Preview modal ── */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="card m-0 sm:m-4 max-w-lg w-full rounded-t-2xl sm:rounded-2xl overflow-hidden"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: preview.accentColor + '22', border: `1.5px solid ${preview.accentColor}55` }}>
                  <preview.Icon sx={{ fontSize: 20, color: preview.accentColor }} />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold leading-tight">{preview.name}</h3>
                  <p className="text-xs text-slate-500">{preview.provider}</p>
                </div>
              </div>
              <button onClick={() => setPreview(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <CloseIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Game art */}
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              <preview.ArtComponent />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="flex items-center gap-1 bg-yellow-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                  <EmojiEventsIcon sx={{ fontSize: 12 }} />
                  {preview.pslTag}
                </span>
                <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                  <AccessTimeIcon sx={{ fontSize: 12 }} />
                  Upcoming
                </span>
              </div>
              {preview.hot && (
                <span className="absolute top-3 right-3 flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                  <LocalFireDepartmentIcon sx={{ fontSize: 14 }} />
                  HOT
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700">
              {[
                { label: 'Max Payout', value: preview.maxPayout },
                { label: 'Min Bet', value: preview.minBet },
                { label: 'Category', value: preview.family.charAt(0).toUpperCase() + preview.family.slice(1) },
              ].map(({ label, value }) => (
                <div key={label} className="py-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="px-4 py-3.5">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{preview.longDesc}</p>
            </div>

            {/* Actions */}
            <div className="px-4 pb-5 flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              {notified.has(preview.slug) ? (
                <button
                  disabled
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-500 text-white flex items-center justify-center gap-2 opacity-90 cursor-default"
                >
                  <NotificationsActiveIcon sx={{ fontSize: 16 }} />
                  Notified!
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleNotify(preview.slug);
                    setPreview(null);
                  }}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <NotificationsActiveIcon sx={{ fontSize: 16 }} />
                  Notify Me
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}