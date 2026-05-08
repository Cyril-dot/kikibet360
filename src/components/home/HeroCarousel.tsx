import { useState, useEffect } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BoltIcon from '@mui/icons-material/Bolt';
import ShareIcon from '@mui/icons-material/Share';

const slides = [
  {
    title: '100% First Deposit Bonus',
    subtitle: 'Up to GH₵1,000',
    description: 'Make your first deposit and double your money instantly!',
    gradient: 'from-primary/75 to-red-700/75',
    icon: <BoltIcon className="text-yellow-300" fontSize="large" />,
    image: 'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg',
  },
  {
    title: 'Multi-Bet Boost',
    subtitle: '+30% Extra Winnings',
    description: 'Add 4+ selections to your bet slip and get 30% more on winnings.',
    gradient: 'from-emerald-600/75 to-teal-700/75',
    icon: <BoltIcon className="text-yellow-300" fontSize="large" />,
    image: 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg',
  },
  {
    title: 'Refer & Earn',
    subtitle: 'GH₵200 Per Referral',
    description: 'Invite friends and earn GH₵200 when they make their first deposit.',
    gradient: 'from-blue-600/75 to-indigo-700/75',
    icon: <ShareIcon className="text-yellow-300" fontSize="large" />,
    image: 'https://picsum.photos/seed/soccer3/1200/500',
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(slides.map(() => false));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
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
        {slides.map((slide, i) => (
          <div key={i} className="relative min-w-full min-h-[180px] sm:min-h-[220px] md:min-h-[260px]">

            {/* Fallback gradient shown while image loads */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient.replace('/75', '')}`} />

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

            {/* Gradient overlay on top of image */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />

            {/* Content */}
            <div className="relative z-10 p-5 sm:p-7 md:p-10 text-white flex flex-col justify-center min-h-[180px] sm:min-h-[220px] md:min-h-[260px]">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                {slide.icon}
                <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                  {slide.subtitle}
                </span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold mb-2 drop-shadow-sm">
                {slide.title}
              </h2>
              <p className="text-xs sm:text-sm md:text-base opacity-90 max-w-md leading-relaxed">
                {slide.description}
              </p>
              <button className="mt-4 self-start bg-white text-slate-900 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm hover:bg-slate-100 active:scale-95 transition-all touch-manipulation">
                Claim Now
              </button>
            </div>
          </div>
        ))}
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