import { useState, useEffect } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BoltIcon from '@mui/icons-material/Bolt';
import ShareIcon from '@mui/icons-material/Share';

const slides = [
  {
    title: '100% First Deposit Bonus',
    subtitle: 'Up to GH\u20B51,000',
    description: 'Make your first deposit and double your money instantly!',
    gradient: 'from-primary to-red-700',
    icon: <BoltIcon className="text-yellow-300" fontSize="large" />,
  },
  {
    title: 'Multi-Bet Boost',
    subtitle: '+30% Extra Winnings',
    description: 'Add 4+ selections to your bet slip and get 30% more on winnings.',
    gradient: 'from-emerald-600 to-teal-700',
    icon: <BoltIcon className="text-yellow-300" fontSize="large" />,
  },
  {
    title: 'Refer & Earn',
    subtitle: 'GH\u20B5200 Per Referral',
    description: 'Invite friends and earn GH\u20B5200 when they make their first deposit.',
    gradient: 'from-blue-600 to-indigo-700',
    icon: <ShareIcon className="text-yellow-300" fontSize="large" />,
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <div className="relative overflow-hidden rounded-xl mx-4 mt-4">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`min-w-full bg-gradient-to-r ${slide.gradient} p-6 md:p-10 text-white`}
          >
            <div className="flex items-center gap-3 mb-2">
              {slide.icon}
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{slide.subtitle}</span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">{slide.title}</h2>
            <p className="text-sm md:text-base opacity-90 max-w-md">{slide.description}</p>
            <button className="mt-4 bg-white text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-slate-100 transition-colors">
              Claim Now
            </button>
          </div>
        ))}
      </div>

      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors">
        <ChevronLeftIcon fontSize="small" />
      </button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors">
        <ChevronRightIcon fontSize="small" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
