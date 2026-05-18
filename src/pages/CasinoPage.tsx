import { useState, useEffect } from 'react';

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

// ---------------------------------------------------------------------------
// Ghana-only currency config
// ---------------------------------------------------------------------------
export interface CurrencyConfig {
  code: string;
  symbol: string;
  countryCode: string;
  locale: string;
  minBets: {
    default: number;
    aviator: number;
    'sporty-jet': number;
    mines: number;
    'virtual-football': number;
  };
}

export const GHANA_CURRENCY: CurrencyConfig = {
  code: 'GHS',
  symbol: 'GH₵',
  countryCode: 'GH',
  locale: 'en-GH',
  minBets: {
    default: 5,
    aviator: 5,
    'sporty-jet': 5,
    mines: 10,
    'virtual-football': 10,
  },
};

export function formatAmount(amount: number, cfg: CurrencyConfig): string {
  return `${cfg.symbol}${amount.toLocaleString(cfg.locale)}`;
}

// ---------------------------------------------------------------------------
// useCurrency — always Ghana, no geo call needed
// ---------------------------------------------------------------------------
export function useCurrency() {
  return { currency: GHANA_CURRENCY, loading: false, error: false };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CasinoGame {
  slug: string;
  name: string;
  provider: string;
  family: string;
  maxPayout: string;
  desc: string;
  longDesc: string;
  accentColor: string;
  hot: boolean;
  gplTag: string;
  Icon: React.ElementType;
  GameIllustration: React.FC;
}

// ---------------------------------------------------------------------------
// Custom SVG Illustrations — one per game
// ---------------------------------------------------------------------------

/** AVIATOR — plane climbing through clouds with a rising multiplier arc */
const AviatorIllustration: React.FC = () => (
  <svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    {/* Sky gradient */}
    <defs>
      <linearGradient id="avSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a0a2e" />
        <stop offset="100%" stopColor="#1a1050" />
      </linearGradient>
      <linearGradient id="avTrail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ff6b35" stopOpacity="0" />
        <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#avSky)" />

    {/* Stars */}
    {[[30,20],[80,10],[150,35],[200,8],[280,25],[350,12],[420,30],[500,18],[580,8],[610,38]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="1.5" fill="#fff" opacity={0.5 + (i % 3) * 0.2} />
    ))}

    {/* Multiplier arc path */}
    <path d="M 30 180 Q 200 170 400 90 Q 500 55 560 30" fill="none" stroke="#ff6b35" strokeWidth="3" strokeDasharray="6 3" opacity="0.7" />

    {/* Plane (at tip of arc) */}
    <g transform="translate(535, 42) rotate(-32)">
      {/* Fuselage */}
      <ellipse cx="0" cy="0" rx="28" ry="7" fill="#fff" />
      {/* Nose */}
      <polygon points="28,-4 42,0 28,4" fill="#e0e0e0" />
      {/* Wing */}
      <polygon points="-5,-7 10,-7 8,12 -10,12" fill="#cccccc" />
      {/* Tail */}
      <polygon points="-22,-7 -14,-7 -18,-18 -26,-12" fill="#aaaaaa" />
      {/* Engine glow */}
      <ellipse cx="-30" cy="0" rx="5" ry="3" fill="#ff6b35" opacity="0.9" />
    </g>

    {/* Trail flame */}
    <ellipse cx="488" cy="58" rx="28" ry="5" fill="url(#avTrail)" transform="rotate(-32,488,58)" opacity="0.8" />

    {/* Multiplier labels along arc */}
    {[{x:80,y:168,t:'1x'},{x:210,y:138,t:'5x'},{x:340,y:95,t:'25x'},{x:450,y:62,t:'100x'}].map(({x,y,t}) => (
      <text key={t} x={x} y={y} fill="#ff6b35" fontSize="13" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">{t}</text>
    ))}

    {/* "CASH OUT" pulse zone */}
    <rect x="480" y="14" width="80" height="22" rx="11" fill="#ff6b35" opacity="0.15" />
    <text x="520" y="30" fill="#ff6b35" fontSize="11" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">CASH OUT!</text>

    {/* Ground line */}
    <line x1="0" y1="192" x2="640" y2="192" stroke="#ff6b35" strokeWidth="1" opacity="0.3" />
    <text x="20" y="197" fill="#ff6b35" fontSize="10" fontFamily="sans-serif" opacity="0.7">0x</text>
  </svg>
);

/** SPORTY JET — rocket blasting through space past planets */
const SportyJetIllustration: React.FC = () => (
  <svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <defs>
      <linearGradient id="spSpace" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#04000f" />
        <stop offset="100%" stopColor="#130030" />
      </linearGradient>
      <linearGradient id="spFlame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7b2ff7" />
        <stop offset="100%" stopColor="#e040fb" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="spRocketBody" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#9c27b0" />
        <stop offset="100%" stopColor="#ce93d8" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#spSpace)" />

    {/* Stars */}
    {[[15,15],[60,40],[120,8],[200,50],[260,20],[320,45],[390,10],[450,35],[510,5],[590,25],[630,50],[70,80],[180,90],[300,70],[480,85]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 2 : 1} fill="#fff" opacity={0.3 + (i % 5) * 0.14} />
    ))}

    {/* Distant planet 1 */}
    <circle cx="100" cy="70" r="25" fill="#1a0040" stroke="#7b2ff7" strokeWidth="1.5" opacity="0.7" />
    <ellipse cx="100" cy="70" rx="38" ry="8" fill="none" stroke="#9c27b0" strokeWidth="1" opacity="0.5" />

    {/* Distant planet 2 */}
    <circle cx="550" cy="50" r="18" fill="#001a10" stroke="#00e676" strokeWidth="1" opacity="0.6" />

    {/* Multiplier trail streak */}
    {[0,1,2,3,4].map(i => (
      <line key={i} x1={500 - i*80} y1={110 + i*12} x2={540 - i*80} y2={95 + i*12}
        stroke="#7b2ff7" strokeWidth={3 - i * 0.4} opacity={0.8 - i * 0.15} />
    ))}

    {/* Rocket body */}
    <g transform="translate(520,95) rotate(-38)">
      {/* Body */}
      <rect x="-8" y="-32" width="16" height="52" rx="8" fill="url(#spRocketBody)" />
      {/* Nose cone */}
      <polygon points="-8,-32 0,-52 8,-32" fill="#f3e5f5" />
      {/* Window */}
      <circle cx="0" cy="-12" r="6" fill="#7b2ff7" />
      <circle cx="0" cy="-12" r="3" fill="#e1bee7" opacity="0.9" />
      {/* Fins */}
      <polygon points="-8,16 -20,32 -8,28" fill="#9c27b0" />
      <polygon points="8,16 20,32 8,28" fill="#9c27b0" />
      {/* Flame */}
      <ellipse cx="0" cy="28" rx="6" ry="18" fill="url(#spFlame)" opacity="0.9" />
      <ellipse cx="0" cy="34" rx="3" ry="10" fill="#fff" opacity="0.6" />
    </g>

    {/* Multiplier labels */}
    {[{x:60,y:145,t:'1x'},{x:160,y:130,t:'10x'},{x:300,y:108,t:'100x'},{x:420,y:92,t:'500x'}].map(({x,y,t}) => (
      <text key={t} x={x} y={y} fill="#ce93d8" fontSize="12" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">{t}</text>
    ))}

    {/* "750x MAX" badge */}
    <rect x="560" y="8" width="68" height="22" rx="11" fill="#7b2ff7" opacity="0.25" />
    <text x="594" y="24" fill="#e040fb" fontSize="11" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">750x MAX</text>
  </svg>
);

/** MINES — 5×5 gem grid with some revealed and one exploding bomb */
const MinesIllustration: React.FC = () => {
  const cols = 7;
  const rows = 4;
  const cellW = 640 / cols;
  const cellH = 200 / rows;
  const pad = 6;

  // Which cells are gems (true), bombs (false), or hidden (null)
  const states: (boolean | null)[][] = [
    [true,  null, null, true,  null, null, true ],
    [null,  true, null, null,  false,null, null ],
    [true,  null, true, null,  null, null, true ],
    [null,  null, null, true,  null, true, null ],
  ];

  return (
    <svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="mBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#041a0a" />
          <stop offset="100%" stopColor="#071f0d" />
        </linearGradient>
        <linearGradient id="mGem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00ff88" />
          <stop offset="100%" stopColor="#00bcd4" />
        </linearGradient>
        <linearGradient id="mBomb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4444" />
          <stop offset="100%" stopColor="#ff9800" />
        </linearGradient>
      </defs>
      <rect width="640" height="200" fill="url(#mBg)" />

      {states.map((row, ri) =>
        row.map((state, ci) => {
          const x = ci * cellW + pad;
          const y = ri * cellH + pad;
          const w = cellW - pad * 2;
          const h = cellH - pad * 2;
          const cx = x + w / 2;
          const cy = y + h / 2;

          if (state === null) {
            // Hidden cell
            return (
              <rect key={`${ri}-${ci}`} x={x} y={y} width={w} height={h} rx="8"
                fill="#0d2e14" stroke="#1a4a22" strokeWidth="1" />
            );
          }
          if (state === true) {
            // Gem
            return (
              <g key={`${ri}-${ci}`}>
                <rect x={x} y={y} width={w} height={h} rx="8"
                  fill="#071f0d" stroke="#00ff8866" strokeWidth="1.5" />
                {/* Diamond gem shape */}
                <polygon
                  points={`${cx},${cy-14} ${cx+12},${cy} ${cx},${cy+14} ${cx-12},${cy}`}
                  fill="url(#mGem)" opacity="0.95"
                />
                <polygon
                  points={`${cx},${cy-14} ${cx+12},${cy} ${cx},${cy-2}`}
                  fill="#fff" opacity="0.3"
                />
                {/* Sparkle */}
                <circle cx={cx+10} cy={cy-12} r="2" fill="#fff" opacity="0.8" />
              </g>
            );
          }
          // Bomb — exploding
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={x} y={y} width={w} height={h} rx="8" fill="#2a0000" stroke="#ff444466" strokeWidth="1.5" />
              {/* Explosion rays */}
              {[0,45,90,135,180,225,270,315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = cx + Math.cos(rad) * 10;
                const y1 = cy + Math.sin(rad) * 10;
                const x2 = cx + Math.cos(rad) * 20;
                const y2 = cy + Math.sin(rad) * 20;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff9800" strokeWidth="2" opacity="0.8" />;
              })}
              <circle cx={cx} cy={cy} r="10" fill="url(#mBomb)" />
              <circle cx={cx-3} cy={cy-3} r="3" fill="#fff" opacity="0.4" />
            </g>
          );
        })
      )}

      {/* Multiplier overlay */}
      <rect x="240" y="80" width="160" height="40" rx="8" fill="#000" opacity="0.6" />
      <text x="320" y="105" fill="#00ff88" fontSize="18" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">3.45x</text>
    </svg>
  );
};

/** VIRTUAL FOOTBALL — top-down football pitch with ball trajectory */
const VirtualFootballIllustration: React.FC = () => (
  <svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <defs>
      <linearGradient id="vfPitch" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a4a0a" />
        <stop offset="100%" stopColor="#0d3005" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#vfPitch)" />

    {/* Pitch stripes */}
    {[0,1,2,3,4,5].map(i => (
      <rect key={i} x={i * 107} y="0" width="53" height="200" fill="#1d5510" opacity="0.4" />
    ))}

    {/* Pitch boundary */}
    <rect x="20" y="15" width="600" height="170" rx="4" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />

    {/* Centre circle */}
    <circle cx="320" cy="100" r="35" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
    <circle cx="320" cy="100" r="3" fill="#fff" opacity="0.6" />
    {/* Centre line */}
    <line x1="320" y1="15" x2="320" y2="185" stroke="#fff" strokeWidth="1.5" opacity="0.4" />

    {/* Left penalty box */}
    <rect x="20" y="60" width="80" height="80" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4" />
    <rect x="20" y="80" width="40" height="40" fill="none" stroke="#fff" strokeWidth="1" opacity="0.35" />
    {/* Left goal */}
    <rect x="12" y="85" width="10" height="30" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />

    {/* Right penalty box */}
    <rect x="540" y="60" width="80" height="80" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4" />
    <rect x="580" y="80" width="40" height="40" fill="none" stroke="#fff" strokeWidth="1" opacity="0.35" />
    {/* Right goal */}
    <rect x="618" y="85" width="10" height="30" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />

    {/* Players (triangles = shirt shapes) */}
    {[
      // Team A (yellow - Ghana kit)
      {x:120,y:90,c:'#FFD700'},{x:180,y:60,c:'#FFD700'},{x:180,y:140,c:'#FFD700'},
      {x:240,y:100,c:'#FFD700'},{x:290,y:75,c:'#FFD700'},
      // Team B (red)
      {x:380,y:100,c:'#e53935'},{x:430,y:70,c:'#e53935'},{x:430,y:130,c:'#e53935'},
      {x:490,y:95,c:'#e53935'},{x:540,y:110,c:'#e53935'},
    ].map(({x,y,c},i) => (
      <g key={i} transform={`translate(${x},${y})`}>
        <circle r="9" fill={c} opacity="0.9" />
        <circle r="4" fill={c === '#FFD700' ? '#333' : '#fff'} opacity="0.6" />
      </g>
    ))}

    {/* Ball trajectory arc */}
    <path d="M 290 75 Q 350 30 460 70" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="5 3" opacity="0.8" />
    {/* Ball */}
    <circle cx="460" cy="70" r="8" fill="#fff" />
    <circle cx="460" cy="70" r="8" fill="none" stroke="#333" strokeWidth="1" />
    {/* Ball pentagon pattern */}
    <polygon points="460,63 464,66 463,71 457,71 456,66" fill="#333" opacity="0.7" />

    {/* Score banner */}
    <rect x="240" y="155" width="160" height="28" rx="6" fill="#000" opacity="0.65" />
    <text x="320" y="173" fill="#FFD700" fontSize="14" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">Hearts FC  2 – 1  Kotoko</text>
  </svg>
);

// ---------------------------------------------------------------------------
// Game catalogue — Ghana / GPL focused
// ---------------------------------------------------------------------------
const casinoGames: CasinoGame[] = [
  {
    slug: 'aviator',
    name: 'Aviator',
    provider: 'Spribe',
    family: 'crash',
    maxPayout: '1000x',
    desc: 'Cash out before the multiplier crashes. Hold your nerve for massive rewards.',
    longDesc:
      "Aviator is the world's most iconic crash game. Watch the multiplier climb — from 1x to 1000x. The longer you wait, the more you win. But if you don't cash out in time, you lose it all. Pure adrenaline, every round. Minimum bet is GH₵5.",
    accentColor: '#ff6b35',
    hot: true,
    gplTag: 'GPL 2024/25',
    Icon: FlightTakeoffIcon,
    GameIllustration: AviatorIllustration,
  },
  {
    slug: 'sporty-jet',
    name: 'Sporty Jet',
    provider: 'In-House',
    family: 'crash',
    maxPayout: '750x',
    desc: 'A high-speed space crash game with multipliers launching beyond the stratosphere.',
    longDesc:
      'Sporty Jet takes crash games to the cosmos. Ride the rocket as it blasts through space — time your cashout perfectly and walk away with up to 750x your stake. Lightning-fast rounds mean no downtime, only action. Minimum bet is GH₵5.',
    accentColor: '#7b2ff7',
    hot: true,
    gplTag: 'GPL 2024/25',
    Icon: RocketLaunchIcon,
    GameIllustration: SportyJetIllustration,
  },
  {
    slug: 'mines',
    name: 'Mines',
    provider: 'In-House',
    family: 'skill',
    maxPayout: '1000x',
    desc: 'Reveal gems across the grid. One wrong move and the bomb ends it all.',
    longDesc:
      'Mines is the ultimate game of nerves. A 5×5 grid hides gems and bombs — reveal gems to grow your multiplier, but detonate a mine and you lose your stake. You control the risk: choose how many mines are on the board before each round. Minimum bet is GH₵10.',
    accentColor: '#00ff88',
    hot: false,
    gplTag: 'GPL 2024/25',
    Icon: DiamondIcon,
    GameIllustration: MinesIllustration,
  },
  {
    slug: 'virtual-football',
    name: 'Virtual Football',
    provider: 'In-House',
    family: 'virtual',
    maxPayout: '200x',
    desc: 'Bet on realistic virtual GPL-style football matches running 24/7.',
    longDesc:
      'Virtual Football brings the excitement of GPL-style football to your fingertips — 24 hours a day, 7 days a week. Predict match outcomes, scorelines, and top scorers in AI-powered matches featuring teams like Hearts of Oak and Kotoko, with real football physics and realistic team stats. Minimum bet is GH₵10.',
    accentColor: '#44dd88',
    hot: false,
    gplTag: 'GPL 2024/25',
    Icon: SportsSoccerIcon,
    GameIllustration: VirtualFootballIllustration,
  },
];

const categories = [
  { key: 'all',     label: 'All Games' },
  { key: 'crash',   label: 'Crash' },
  { key: 'skill',   label: 'Skill' },
  { key: 'virtual', label: 'Virtual' },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function CasinoPage() {
  const { currency } = useCurrency();

  const [activeCategory, setActiveCategory] = useState('all');
  const [preview, setPreview]               = useState<CasinoGame | null>(null);
  const [notified, setNotified]             = useState<Set<string>>(new Set());

  const filtered =
    activeCategory === 'all'
      ? casinoGames
      : casinoGames.filter((g) => g.family === activeCategory);

  function getMinBet(slug: string): string {
    const key    = slug as keyof CurrencyConfig['minBets'];
    const amount = currency.minBets[key] ?? currency.minBets.default;
    return formatAmount(amount, currency);
  }

  const handleNotify = (slug: string) =>
    setNotified(prev => new Set([...prev, slug]));

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: 'var(--card-alt)' }}>
      <div className="max-w-6xl mx-auto p-4">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}
            >
              <CasinoIcon style={{ color: '#fff' }} fontSize="medium" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
                Casino
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                4 upcoming GPL games
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Ghana currency badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, #10b981 12%, var(--card-alt))',
                border: '1px solid color-mix(in srgb, #10b981 30%, var(--border-light))',
              }}
            >
              {/* Ghana flag colours dot */}
              <span style={{ fontSize: 14 }}>🇬🇭</span>
              <span className="text-xs font-bold" style={{ color: '#10b981' }}>GHS</span>
            </div>
            {/* GPL badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, #eab308 12%, var(--card-alt))',
                border: '1px solid color-mix(in srgb, #eab308 30%, var(--border-light))',
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 16, color: '#eab308' }} />
              <span className="text-xs font-bold" style={{ color: '#eab308' }}>GPL 2024/25</span>
            </div>
          </div>
        </div>

        {/* ── GPL upcoming banner ────────────────────────────────────────── */}
        <div
          className="relative mb-6 rounded-2xl overflow-hidden p-5"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--border-light) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
              opacity: 0.5,
            }}
          />
          <div className="relative flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}
            >
              <EmojiEventsIcon style={{ color: '#fff' }} fontSize="medium" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#eab308' }}>
                  Upcoming
                </span>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--border-light)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Ghana Premier League
                </span>
              </div>
              <h2 className="font-bold text-base leading-snug" style={{ color: 'var(--text-main)' }}>
                GPL 2024/25 Casino Games are almost here 🎰
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                All 4 games coming soon · Amounts in GH₵ · Notify yourself to be first in line.
              </p>
            </div>
            <div
              className="flex-shrink-0 hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, #eab308 10%, transparent)',
                border: '1px solid color-mix(in srgb, #eab308 30%, var(--border-light))',
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 14, color: '#eab308' }} />
              <span className="text-xs font-bold" style={{ color: '#eab308' }}>Coming Soon</span>
            </div>
          </div>
        </div>

        {/* ── Category pills ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide">
          <FilterListIcon sx={{ fontSize: 18 }} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {categories.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? 'var(--primary)' : 'var(--card-bg)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border-light)'}`,
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {cat.label}
                {cat.key === 'all' && (
                  <span
                    className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'var(--card-alt)',
                      color: active ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {casinoGames.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Game grid ──────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <CasinoIcon sx={{ fontSize: 48 }} style={{ opacity: 0.3 }} />
            <p className="mt-3">No games in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((game) => {
              const isNotified = notified.has(game.slug);
              const minBet     = getMinBet(game.slug);
              return (
                <button
                  key={game.slug}
                  onClick={() => setPreview(game)}
                  className="overflow-hidden text-left group relative rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-light)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  }}
                  onMouseEnter={e =>
                    ((e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.16)')
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)')
                  }
                >
                  {/* Game Illustration */}
                  <div className="relative overflow-hidden" style={{ height: '180px' }}>
                    <div className="w-full h-full transition-transform duration-300 group-hover:scale-105">
                      <game.GameIllustration />
                    </div>
                    {/* Bottom scrim */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.02) 55%, transparent 100%)',
                      }}
                    />

                    {/* Top-left badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                      <span className="flex items-center gap-1 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                        <EmojiEventsIcon sx={{ fontSize: 10 }} />
                        {game.gplTag}
                      </span>
                      <span
                        className="flex items-center gap-1 text-white text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                      >
                        <AccessTimeIcon sx={{ fontSize: 10 }} />
                        Upcoming
                      </span>
                    </div>

                    {/* HOT badge */}
                    {game.hot && (
                      <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                        <LocalFireDepartmentIcon sx={{ fontSize: 11 }} />
                        HOT
                      </span>
                    )}

                    {/* Notified overlay */}
                    {isNotified && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,0,0,0.52)' }}
                      >
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
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: game.accentColor + '22',
                          border: `1px solid ${game.accentColor}44`,
                        }}
                      >
                        <game.Icon sx={{ fontSize: 18, color: game.accentColor }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>
                          {game.name}
                        </h3>
                        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {game.provider} · Min {minBet} · Max {game.maxPayout}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                        View
                      </span>
                      <ArrowForwardIcon sx={{ fontSize: 14 }} style={{ color: 'var(--primary)' }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Preview modal ──────────────────────────────────────────────── */}
        {preview && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.76)', backdropFilter: 'blur(4px)' }}
            onClick={() => setPreview(null)}
          >
            <div
              className="m-0 sm:m-4 max-w-lg w-full rounded-t-2xl sm:rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
              }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              {/* Modal top bar */}
              <div
                className="flex justify-between items-center px-4 pt-4 pb-3"
                style={{ borderBottom: '1px solid var(--border-light)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: preview.accentColor + '22',
                      border: `1.5px solid ${preview.accentColor}55`,
                    }}
                  >
                    <preview.Icon sx={{ fontSize: 20, color: preview.accentColor }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
                      {preview.name}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {preview.provider}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-alt)')
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                  }
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </button>
              </div>

              {/* Modal illustration */}
              <div className="relative overflow-hidden" style={{ height: '200px' }}>
                <preview.GameIllustration />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.04) 55%, transparent 100%)',
                  }}
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="flex items-center gap-1 bg-yellow-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                    <EmojiEventsIcon sx={{ fontSize: 12 }} />
                    {preview.gplTag}
                  </span>
                  <span
                    className="flex items-center gap-1 text-white text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                  >
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
              <div
                className="grid grid-cols-3"
                style={{
                  borderTop: '1px solid var(--border-light)',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                {[
                  { label: 'Max Payout', value: preview.maxPayout },
                  { label: 'Min Bet',    value: getMinBet(preview.slug) },
                  { label: 'Category',   value: preview.family.charAt(0).toUpperCase() + preview.family.slice(1) },
                ].map(({ label, value }, i, arr) => (
                  <div
                    key={label}
                    className="py-3 text-center"
                    style={{
                      borderRight: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-main)' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Ghana currency note */}
              <div
                className="mx-4 mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: 'var(--card-alt)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontSize: 13 }}>🇬🇭</span>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Amounts shown in{' '}
                  <span className="font-bold" style={{ color: 'var(--text-main)' }}>
                    Ghana Cedis (GH₵)
                  </span>
                </p>
              </div>

              {/* Description */}
              <div className="px-4 py-3.5">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {preview.longDesc}
                </p>
              </div>

              {/* Action buttons */}
              <div className="px-4 pb-5 flex gap-3">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: 'var(--card-alt)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-main)',
                  }}
                  onMouseEnter={e =>
                    ((e.currentTarget as HTMLElement).style.filter = 'brightness(0.95)')
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLElement).style.filter = '')
                  }
                >
                  Close
                </button>

                {notified.has(preview.slug) ? (
                  <button
                    disabled
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-default"
                    style={{ backgroundColor: '#10b981', color: '#fff', opacity: 0.9 }}
                  >
                    <NotificationsActiveIcon sx={{ fontSize: 16 }} />
                    Notified!
                  </button>
                ) : (
                  <button
                    onClick={() => { handleNotify(preview.slug); setPreview(null); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                    style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                    onMouseEnter={e =>
                      ((e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)')
                    }
                    onMouseLeave={e =>
                      ((e.currentTarget as HTMLElement).style.filter = '')
                    }
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
    </div>
  );
}