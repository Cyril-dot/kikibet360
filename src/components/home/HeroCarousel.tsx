import { useState, useEffect } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StarIcon from '@mui/icons-material/Star';

// Inline SVG flags — real country flags
const FlagEngland = () => (
  <svg width="22" height="15" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="40" fill="white"/>
    <rect x="24" width="12" height="40" fill="#CC0000"/>
    <rect y="14" width="60" height="12" fill="#CC0000"/>
  </svg>
);

const FlagSpain = () => (
  <svg width="22" height="15" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="40" fill="#c60b1e"/>
    <rect y="10" width="60" height="20" fill="#ffc400"/>
  </svg>
);

const FlagGermany = () => (
  <svg width="22" height="15" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="40" fill="#000000"/>
    <rect y="13.3" width="60" height="13.3" fill="#DD0000"/>
    <rect y="26.6" width="60" height="13.4" fill="#FFCE00"/>
  </svg>
);

const FlagItaly = () => (
  <svg width="22" height="15" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="40" fill="#CE2B37"/>
    <rect width="40" height="40" fill="#fff"/>
    <rect width="20" height="40" fill="#009246"/>
  </svg>
);

const FlagFrance = () => (
  <svg width="22" height="15" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="40" fill="#ED2939"/>
    <rect width="40" height="40" fill="#fff"/>
    <rect width="20" height="40" fill="#002395"/>
  </svg>
);

const FlagEurope = () => (
  <svg width="22" height="15" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="40" fill="#003399"/>
    {[0,1,2,3,4,5,6,7,8,9,10,11].map((n) => {
      const angle = (n * 30 - 90) * (Math.PI / 180);
      const cx = 30 + 11 * Math.cos(angle);
      const cy = 20 + 11 * Math.sin(angle);
      return <circle key={n} cx={cx} cy={cy} r="2" fill="#FFDD00" />;
    })}
  </svg>
);

// League badge colors per league
const leagueBadge: Record<string, { bg: string; text: string; label: string }> = {
  'Premier League':        { bg: '#38003c', text: '#00ff85', label: 'PL' },
  'La Liga':               { bg: '#ff4b1f', text: '#ffffff', label: 'LL' },
  'Bundesliga':            { bg: '#d3010c', text: '#ffd700', label: 'BL' },
  'Serie A':               { bg: '#1a1a6e', text: '#ffffff', label: 'SA' },
  'Ligue 1':               { bg: '#daa520', text: '#091c3e', label: 'L1' },
  'UEFA Champions League': { bg: '#0a1172', text: '#c0a020', label: 'UCL' },
};

const slides = [
  {
    league: 'Premier League',
    country: 'England',
    Flag: FlagEngland,
    winner: 'Arsenal',
    season: '2025/26 Champions',
    image: 'https://platform.theshortfuse.sbnation.com/wp-content/uploads/sites/165/2025/08/gettyimages-2229282520.jpg?quality=90&strip=all&crop=0,8.8902317441006,100,82.219536511799',
  },
  {
    league: 'La Liga',
    country: 'Spain',
    Flag: FlagSpain,
    winner: 'FC Barcelona',
    season: '2025/26 Champions',
    image: 'https://platform.barcablaugranes.com/wp-content/uploads/sites/21/2026/05/gettyimages-2275040752.jpg?quality=90&strip=all&crop=0%2C0.02498750624688%2C100%2C99.950024987506&w=2400',
  },
  {
    league: 'Bundesliga',
    country: 'Germany',
    Flag: FlagGermany,
    winner: 'Bayern Munich',
    season: '2025/26 Champions',
    image: 'https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-16x9-seo/v1770575366/cms/public/images/fcbayern-com/homepage/Saison-25-26/Galerien/Spiele/fcb-hoffenheim/04-fcbayern-hoffenheim-260208-mel.jpg',
  },
  {
    league: 'Serie A',
    country: 'Italy',
    Flag: FlagItaly,
    winner: 'Inter Milan',
    season: '2025/26 Champions',
    image: 'https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-4x3-seo-thumbnail/v1741682360/cms/public/images/fcbayern-com/homepage/Saison-24-25/Gegnerteams/Inter%20Mailand/inter-mailand-viertelfinale-champions-league-gegner-ima.jpg',
  },
  {
    league: 'Ligue 1',
    country: 'France',
    Flag: FlagFrance,
    winner: 'Paris Saint-Germain',
    season: '2025/26 Champions',
    image: 'https://assets.goal.com/images/v3/bltea264cd9dfaab053/GOAL%20-%20Blank%20WEB%20-%20Facebook%20(25).jpg?auto=webp&format=pjpg&width=3840&quality=60',
  },
  {
    league: 'UEFA Champions League',
    country: 'Europe',
    Flag: FlagEurope,
    winner: 'Final: PSG vs Arsenal',
    season: 'May 30, 2026 · Budapest',
    image: 'https://editorial.uefa.com/resources/0298-1da13f6acf3e-760def7d0dbf-1000/ucl_24x27_-_h2h_-_facebook.jpeg',
    isPending: true,
  },
];

export default function LeagueWinnersCarousel() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(slides.map(() => false));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  const handleLoad = (i: number) => {
    setLoaded((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  return (
    <div className="relative overflow-hidden rounded-xl mx-3 sm:mx-4 mt-3 sm:mt-4 shadow-lg">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => {
          const badge = leagueBadge[slide.league];
          const { Flag } = slide;
          return (
            <div key={i} className="relative min-w-full min-h-[180px] sm:min-h-[220px] md:min-h-[260px]">

              {/* Background image */}
              <img
                src={slide.image}
                alt=""
                aria-hidden="true"
                onLoad={() => handleLoad(i)}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${
                  loaded[i] ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Dark fallback while image loads */}
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: loaded[i] ? 0 : 1, transition: 'opacity 0.7s' }}
              />

              {/* S-curve black overlay — left/text side only */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id={`fade-${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="black" stopOpacity="0.88" />
                    <stop offset="50%" stopColor="black" stopOpacity="0.60" />
                    <stop offset="72%" stopColor="black" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="black" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,0 C10,0 15,10 25,30 C35,50 20,55 30,75 C38,90 45,100 0,100 Z"
                  fill={`url(#fade-${i})`}
                />
                <rect x="0" y="0" width="45" height="100" fill={`url(#fade-${i})`} />
              </svg>

              {/* Content */}
              <div className="relative z-10 p-5 sm:p-7 md:p-10 text-white flex flex-col justify-center min-h-[180px] sm:min-h-[220px] md:min-h-[260px] max-w-xs sm:max-w-sm">

                {/* League badge + flag + name row */}
                <div className="flex items-center gap-2 mb-3">

                  {/* League badge (logo substitute) */}
                  <div
                    className="flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-black tracking-tight leading-none"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                      minWidth: 32,
                      height: 20,
                      border: `1px solid ${badge.text}33`,
                    }}
                  >
                    <SportsSoccerIcon style={{ fontSize: 10, marginRight: 2 }} />
                    {badge.label}
                  </div>

                  {/* Country flag */}
                  <div className="rounded-sm overflow-hidden shadow-sm" style={{ lineHeight: 0 }}>
                    <Flag />
                  </div>

                  {/* Country · League */}
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                    {slide.country} · {slide.league}
                  </span>
                </div>

                {/* Winner name */}
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1 drop-shadow-sm leading-tight">
                  {slide.winner}
                </h2>

                {/* Season badge */}
                <div className="flex items-center gap-2 mt-2">
                  {slide.isPending ? (
                    <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-300/40 text-yellow-200 text-xs font-semibold px-3 py-1 rounded-full">
                      <SportsSoccerIcon style={{ fontSize: 13 }} />
                      {slide.season}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      <StarIcon style={{ fontSize: 13 }} />
                      {slide.season}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev button */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 sm:p-1.5 transition-colors touch-manipulation"
      >
        <ChevronLeftIcon fontSize="small" />
      </button>

      {/* Next button */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 sm:p-1.5 transition-colors touch-manipulation"
      >
        <ChevronRightIcon fontSize="small" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 touch-manipulation ${
              i === current ? 'bg-white w-6' : 'bg-white/50 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}