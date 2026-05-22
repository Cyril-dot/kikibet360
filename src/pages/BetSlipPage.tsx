import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatCurrency, calculateTotalOdds, calculatePotentialReturn } from '../utils';
import { bets as betsApi, booking, wallet as walletApi, publicFootball as publicMatches } from '../utils/api';
import type { Bet, BetSelection } from '../utils/api';

import html2canvas from 'html2canvas';

import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/icons-material/Loop';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoginIcon from '@mui/icons-material/Login';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import PublicIcon from '@mui/icons-material/Public';

// ---------------------------------------------------------------------------
// Debug logger — set FUTBALL_DEBUG=true in localStorage to enable
// ---------------------------------------------------------------------------
const DEBUG = (() => {
  try { return localStorage.getItem('FUTBALL_DEBUG') === 'true'; } catch { return false; }
})();
function log(area: string, ...args: unknown[]) {
  if (!DEBUG) return;
  console.log(`%c[Futball:${area}]`, 'color:#E6192E;font-weight:bold', ...args);
}
function logWarn(area: string, ...args: unknown[]) {
  console.warn(`[Futball:${area}]`, ...args);
}
function logError(area: string, ...args: unknown[]) {
  console.error(`[Futball:${area}]`, ...args);
}

// ---------------------------------------------------------------------------
// Currency / IP detection
// ---------------------------------------------------------------------------

/** Minimum stake is GH₵300 — converted to local currency for display */
const MIN_STAKE_GHS = 300;

export interface CurrencyInfo {
  code: string;        // ISO 4217, e.g. "GHS", "USD", "NGN"
  symbol: string;      // e.g. "GH₵", "$", "₦"
  name: string;        // e.g. "Ghanaian Cedi"
  rateToGHS: number;   // 1 GHS = rateToGHS units of this currency
  countryCode: string; // ISO 3166-1 alpha-2
}

/** Static fallback rates (1 GHS = X local). Overridden by live rate when available. */
const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  GH: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi',      rateToGHS: 1,      countryCode: 'GH' },
  US: { code: 'USD', symbol: '$',    name: 'US Dollar',          rateToGHS: 0.067,  countryCode: 'US' },
  GB: { code: 'GBP', symbol: '£',    name: 'British Pound',      rateToGHS: 0.053,  countryCode: 'GB' },
  NG: { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira',     rateToGHS: 107,    countryCode: 'NG' },
  KE: { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',    rateToGHS: 8.6,    countryCode: 'KE' },
  ZA: { code: 'ZAR', symbol: 'R',    name: 'South African Rand', rateToGHS: 1.25,   countryCode: 'ZA' },
  CM: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc BEAC',     rateToGHS: 39.5,   countryCode: 'CM' },
  CI: { code: 'XOF', symbol: 'CFA',  name: 'CFA Franc BCEAO',    rateToGHS: 39.5,   countryCode: 'CI' },
  SN: { code: 'XOF', symbol: 'CFA',  name: 'CFA Franc BCEAO',    rateToGHS: 39.5,   countryCode: 'SN' },
  CA: { code: 'CAD', symbol: 'CA$',  name: 'Canadian Dollar',    rateToGHS: 0.091,  countryCode: 'CA' },
  AU: { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar',  rateToGHS: 0.104,  countryCode: 'AU' },
  DE: { code: 'EUR', symbol: '€',    name: 'Euro',               rateToGHS: 0.062,  countryCode: 'DE' },
  FR: { code: 'EUR', symbol: '€',    name: 'Euro',               rateToGHS: 0.062,  countryCode: 'FR' },
  IT: { code: 'EUR', symbol: '€',    name: 'Euro',               rateToGHS: 0.062,  countryCode: 'IT' },
  ES: { code: 'EUR', symbol: '€',    name: 'Euro',               rateToGHS: 0.062,  countryCode: 'ES' },
  TZ: { code: 'TZS', symbol: 'TSh',  name: 'Tanzanian Shilling', rateToGHS: 171,    countryCode: 'TZ' },
  UG: { code: 'UGX', symbol: 'USh',  name: 'Ugandan Shilling',   rateToGHS: 256,    countryCode: 'UG' },
  ZM: { code: 'ZMW', symbol: 'K',    name: 'Zambian Kwacha',     rateToGHS: 1.74,   countryCode: 'ZM' },
};

const DEFAULT_CURRENCY = CURRENCY_MAP['GH'];

/** Convert GHS → local */
function ghsToLocal(ghsAmount: number, currency: CurrencyInfo): number {
  return ghsAmount * currency.rateToGHS;
}

/** Convert local → GHS */
function localToGHS(localAmount: number, currency: CurrencyInfo): number {
  if (currency.rateToGHS === 0) return 0;
  return localAmount / currency.rateToGHS;
}

/** Format amount with currency symbol */
function formatLocal(amount: number, currency: CurrencyInfo, decimals = 2): string {
  if (amount === 0) return `${currency.symbol}0`;
  return `${currency.symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Detect currency from IP geo-lookup, then attempt a live exchange rate.
 * Falls back gracefully at every step.
 */
async function detectCurrencyFromIP(): Promise<CurrencyInfo> {
  try {
    // Step 1 — IP → country + currency code
    const geoRes = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });
    if (!geoRes.ok) throw new Error('geo request failed');
    const geo = await geoRes.json();

    const countryCode: string = (geo.country_code ?? '').toUpperCase();
    const currencyCode: string = (geo.currency ?? '').toUpperCase();
    log('CurrencyDetect', `IP geo → country=${countryCode}, currency=${currencyCode}, city=${geo.city}`);

    // Step 2 — look up in our static map first
    let base: CurrencyInfo = CURRENCY_MAP[countryCode] ?? {
      code:        currencyCode || 'GHS',
      symbol:      currencyCode || 'GH₵',
      name:        geo.currency_name ?? currencyCode ?? 'Unknown',
      rateToGHS:   1,
      countryCode,
    };

    // If the static map entry has a different code than what the API returned, prefer the API code
    if (currencyCode && base.code !== currencyCode) {
      base = { ...base, code: currencyCode, symbol: currencyCode };
    }

    // Step 3 — fetch live rate GHS → detected currency
    try {
      const rateRes = await fetch(
        `https://api.exchangerate-api.com/v4/latest/GHS`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        const live = rateData?.rates?.[base.code];
        if (typeof live === 'number' && live > 0) {
          log('CurrencyDetect', `Live rate: 1 GHS = ${live} ${base.code}`);
          base = { ...base, rateToGHS: live };
        } else {
          logWarn('CurrencyDetect', `No live rate for ${base.code}, using static rate ${base.rateToGHS}`);
        }
      }
    } catch (rateErr) {
      logWarn('CurrencyDetect', 'Live rate fetch failed — using static rate:', rateErr);
    }

    log('CurrencyDetect', '✅ Final currency info:', base);
    return base;
  } catch (err) {
    logWarn('CurrencyDetect', 'Detection failed entirely — defaulting to GHS:', err);
    return DEFAULT_CURRENCY;
  }
}

// Cache in module scope so we only detect once per session
let _cachedCurrency: CurrencyInfo | null = null;
async function getCurrency(): Promise<CurrencyInfo> {
  if (_cachedCurrency) return _cachedCurrency;
  _cachedCurrency = await detectCurrencyFromIP();
  return _cachedCurrency;
}

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

function buildMatchLabel(s: Record<string, unknown>): string {
  if (!s) return 'Unknown match';
  if (s.matchLabel)  return String(s.matchLabel);
  if (s.match_label) return String(s.match_label);
  if (s.match)       return String(s.match);
  const home = (s.homeTeam ?? s.home_team) as string | undefined;
  const away = (s.awayTeam ?? s.away_team) as string | undefined;
  if (home && away)  return `${home} vs ${away}`;
  const id = (s.matchId ?? s.match_id ?? '') as string;
  return id ? `Match …${id.slice(-6)}` : 'Unknown match';
}

function extractOdds(sel: Record<string, unknown>): number {
  const candidates: Array<[string, unknown]> = [
    ['currentOdds', sel.currentOdds],
    ['oddsLocked',  sel.oddsLocked],
    ['odds',        sel.odds],
    ['value',       sel.value],
    ['odd',         sel.odd],
    ['price',       sel.price],
    ['oddsValue',   sel.oddsValue],
    ['rate',        sel.rate],
  ];
  for (const [key, raw] of candidates) {
    const n = Number(raw);
    if (!isNaN(n) && n > 1) {
      log('extractOdds', `✅ using field "${key}" =`, n, '| full sel:', sel);
      return n;
    }
  }
  logWarn('extractOdds', '⚠️ No valid odds found — defaulting to 1. Full object:', sel);
  return 1;
}

function normaliseBet(bet: Bet): Bet {
  if (!bet) return bet;
  return {
    ...bet,
    placedAt:        bet.placedAt        ?? (bet as any).placed_at,
    settledAt:       bet.settledAt       ?? (bet as any).settled_at,
    totalOdds:       bet.totalOdds       ?? (bet as any).total_odds,
    potentialReturn: bet.potentialReturn ?? (bet as any).potential_return,
    selections: (bet.selections ?? []).map((s) => ({
      ...s,
      oddsLocked: s.oddsLocked ?? (s as any).odds_locked ?? (s as any).odds ?? 1,
      homeTeam:   s.homeTeam   ?? (s as any).home_team,
      awayTeam:   s.awayTeam   ?? (s as any).away_team,
    })),
  };
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cfg: Record<string, string> = {
    won:        'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    lost:       'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    pending:    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    void:       'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    cashed_out: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${cfg[s] ?? cfg.pending}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function SelectionResult({ result }: { result?: string }) {
  if (!result) return null;
  const isWon = result === 'WON';
  return (
    <span className={`text-xs font-semibold ml-1 ${isWon ? 'text-emerald-600' : 'text-rose-500'}`}>
      {isWon ? '✓' : '✗'}
    </span>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${className}`} />;
}

// ---------------------------------------------------------------------------
// Currency indicator pill
// ---------------------------------------------------------------------------
function CurrencyPill({
  currency,
  detecting,
}: {
  currency: CurrencyInfo;
  detecting: boolean;
}) {
  const isGHS = currency.code === 'GHS';
  if (detecting) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 animate-pulse">
        <PublicIcon sx={{ fontSize: 12 }} />
        Detecting location…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      <PublicIcon sx={{ fontSize: 12 }} />
      <span className="font-semibold text-slate-700 dark:text-slate-300">{currency.code}</span>
      {!isGHS && (
        <span className="text-slate-400">· settled in GH₵</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Guest prompt
// ---------------------------------------------------------------------------
function GuestPrompt({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <LoginIcon className="text-primary" sx={{ fontSize: 28 }} />
      </div>
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{message}</p>
      <p className="text-sm text-slate-400 mb-6">Sign in to get started</p>
      <Link to="/login" className="btn-primary px-6 py-2.5 text-sm rounded-xl flex items-center gap-2">
        <LoginIcon fontSize="small" /> Log In
      </Link>
      <Link to="/register" className="mt-3 text-sm text-primary font-medium hover:underline">
        Create account
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share slip image generator
// ---------------------------------------------------------------------------
async function generateSlipImage(bet: Bet, isWin: boolean): Promise<string> {
  log('generateSlipImage', 'Generating slip for bet:', bet.id, 'isWin:', isWin);
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; top: -9999px; left: -9999px; width: 380px;
    background: #0f172a; border-radius: 24px; overflow: hidden;
    font-family: 'Inter', sans-serif;
  `;
  const winColor    = '#22c55e';
  const lossColor   = '#ef4444';
  const accentColor = isWin ? winColor : lossColor;
  const emoji       = isWin ? '🏆' : '😭';

  container.innerHTML = `
    <style>* { box-sizing: border-box; margin: 0; padding: 0; }</style>
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
      <div style="background:${accentColor}; padding:6px 20px; display:flex; align-items:center; justify-content:space-between;">
        <span style="font-size:11px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;">FUTBALL</span>
        <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);">Bet Slip</span>
      </div>
      <div style="padding:28px 24px 20px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">${emoji}</div>
        <div style="font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:6px;">
          ${isWin ? 'YOU WON' : 'BETTER LUCK NEXT TIME'}
        </div>
        <div style="font-size:38px;font-weight:900;color:${accentColor};line-height:1;">
          ${isWin ? `GH₵${bet.potentialReturn.toFixed(2)}` : `GH₵${bet.stake.toFixed(2)}`}
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">
          ${isWin
            ? `Stake: GH₵${bet.stake.toFixed(2)} · Odds: ${bet.totalOdds.toFixed(2)}`
            : `Odds: ${bet.totalOdds.toFixed(2)}`}
        </div>
      </div>
      <div style="height:1px;background:rgba(255,255,255,0.08);margin:0 24px;"></div>
      <div style="padding:16px 24px;display:flex;flex-direction:column;gap:10px;">
        ${bet.selections.map(sel => `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${sel.homeTeam ? `${sel.homeTeam} vs ${sel.awayTeam}` : sel.matchId}
              </div>
              <div style="font-size:13px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${sel.market}: ${sel.selection}
              </div>
            </div>
            <div style="font-size:13px;font-weight:800;color:${accentColor};white-space:nowrap;background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:6px;">
              ${sel.oddsLocked.toFixed(2)}
              ${sel.result
                ? `<span style="color:${sel.result === 'WON' ? winColor : lossColor};margin-left:4px;">${sel.result === 'WON' ? '✓' : '✗'}</span>`
                : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div style="height:1px;background:rgba(255,255,255,0.08);margin:0 24px;"></div>
      <div style="padding:14px 24px;display:flex;justify-content:space-between;">
        <div style="text-align:center;">
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Stake</div>
          <div style="font-size:14px;font-weight:700;color:#fff;">GH₵${bet.stake.toFixed(2)}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Total Odds</div>
          <div style="font-size:14px;font-weight:700;color:${accentColor};">${bet.totalOdds.toFixed(2)}x</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Return</div>
          <div style="font-size:14px;font-weight:700;color:${accentColor};">GH₵${bet.potentialReturn.toFixed(2)}</div>
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.3);padding:12px 24px;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:10px;color:rgba(255,255,255,0.3);">
          ${new Date(bet.placedAt).toLocaleString('en-GH')}
        </div>
        <div style="font-size:11px;font-weight:800;color:${accentColor};letter-spacing:1px;">FUTBALL</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });
    log('generateSlipImage', '✅ Slip image generated successfully');
    return canvas.toDataURL('image/png');
  } finally {
    document.body.removeChild(container);
  }
}

// ---------------------------------------------------------------------------
// Share image modal
// ---------------------------------------------------------------------------
function ShareImageModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `futball-bet-${Date.now()}.png`;
    a.click();
  };

  const handleShare = async () => {
    try {
      const res  = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'futball-bet.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Futball Bet Slip' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-base">Your Bet Slip</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <CloseIcon fontSize="small" />
          </button>
        </div>
        <div className="p-4">
          <img src={imageUrl} alt="Bet slip" className="w-full rounded-2xl shadow-xl" />
        </div>
        <div className="px-4 pb-5 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <DownloadIcon fontSize="small" /> Save
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <ShareIcon fontSize="small" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Win celebration modal
// ---------------------------------------------------------------------------
function WinModal({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const [generatingImage, setGeneratingImage] = useState(false);
  const [shareImageUrl, setShareImageUrl]     = useState<string | null>(null);
  const confettiColors = ['#E6192E','#FFD700','#22C55E','#3B82F6','#F59E0B','#A855F7'];

  const handleShowOff = async () => {
    setGeneratingImage(true);
    try {
      const url = await generateSlipImage(bet, true);
      setShareImageUrl(url);
    } catch (err) {
      logError('WinModal', 'Failed to generate image:', err);
      if (navigator.share) {
        await navigator.share({
          title: `I won GH₵${bet.potentialReturn.toFixed(2)} on Futball! 🏆`,
          text:  `Stake: GH₵${bet.stake} · Odds: ${bet.totalOdds.toFixed(2)}x`,
        });
      }
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 animate-confetti"
              style={{
                left:             `${Math.random() * 100}%`,
                top:              '-8px',
                backgroundColor:  confettiColors[i % confettiColors.length],
                borderRadius:     i % 3 === 0 ? '50%' : '2px',
                animationDelay:   `${Math.random() * 2}s`,
                animationDuration:`${2 + Math.random() * 2}s`,
                transform:        `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
            <div className="flex justify-end px-4 pt-3">
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
            <div className="flex justify-center mt-1 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <SportsSoccerIcon sx={{ fontSize: 18 }} className="text-white" />
                </div>
                <span className="text-white font-black text-lg tracking-tight">FUTBALL</span>
              </div>
            </div>
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.5)]">
                  <EmojiEventsIcon sx={{ fontSize: 52 }} className="text-amber-900" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 scale-110 animate-ping" />
              </div>
            </div>
            <div className="text-center px-6 pb-2">
              <p className="text-xs font-bold tracking-[4px] uppercase text-emerald-400 mb-1">YOU WON</p>
              <p className="text-5xl font-black text-white mb-1">GH₵{bet.potentialReturn.toFixed(2)}</p>
              <p className="text-slate-400 text-sm mb-1">{formatCurrency(bet.potentialReturn)}</p>
            </div>
            <div className="flex justify-around mx-6 my-4 bg-white/5 rounded-2xl p-3">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Total Stake</p>
                <p className="text-sm font-bold text-white">GH₵{bet.stake.toFixed(2)}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Total Odds</p>
                <p className="text-sm font-bold text-emerald-400">{bet.totalOdds.toFixed(2)}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Selections</p>
                <p className="text-sm font-bold text-white">{bet.selections.length}</p>
              </div>
            </div>
            {bet.selections.slice(0, 2).map((sel, i) => (
              <div key={i} className="mx-6 mb-2 px-3 py-2 bg-white/5 rounded-xl flex justify-between items-center">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-xs text-slate-500 truncate">{buildMatchLabel(sel as unknown as Record<string, unknown>)}</p>
                  <p className="text-xs font-semibold text-white truncate">{sel.market}: {sel.selection}</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 shrink-0">{sel.oddsLocked.toFixed(2)}</span>
              </div>
            ))}
            {bet.selections.length > 2 && (
              <p className="text-center text-xs text-slate-500 mb-2">+{bet.selections.length - 2} more selections</p>
            )}
            <div className="px-6 pb-6 pt-3 flex gap-3">
              <button
                onClick={handleShowOff}
                disabled={generatingImage}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {generatingImage
                  ? <><CircularProgress fontSize="small" className="animate-spin" /> Generating…</>
                  : <><ShareIcon fontSize="small" /> Show Off</>}
              </button>
              <Link
                to="/wallet"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white text-sm font-bold flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                Withdraw
              </Link>
            </div>
            <button onClick={onClose} className="w-full pb-5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Continue Betting
            </button>
          </div>
        </div>
      </div>
      {shareImageUrl && <ShareImageModal imageUrl={shareImageUrl} onClose={() => setShareImageUrl(null)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Loss modal
// ---------------------------------------------------------------------------
function LossModal({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const [generatingImage, setGeneratingImage] = useState(false);
  const [shareImageUrl, setShareImageUrl]     = useState<string | null>(null);

  const handleShowOff = async () => {
    setGeneratingImage(true);
    try {
      const url = await generateSlipImage(bet, false);
      setShareImageUrl(url);
    } catch (err) {
      logError('LossModal', 'Failed to generate image:', err);
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500" />
            <div className="flex justify-end px-4 pt-3">
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
            <div className="flex justify-center mt-1 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <SportsSoccerIcon sx={{ fontSize: 18 }} className="text-white" />
                </div>
                <span className="text-white font-black text-lg tracking-tight">FUTBALL</span>
              </div>
            </div>
            <div className="flex justify-center mb-3">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                😭
              </div>
            </div>
            <div className="text-center px-6 pb-2">
              <p className="text-xs font-bold tracking-[3px] uppercase text-rose-400 mb-1">BETTER LUCK NEXT TIME</p>
              <p className="text-4xl font-black text-white mb-1">GH₵{bet.stake.toFixed(2)}</p>
              <p className="text-slate-500 text-sm">That one hurts 😬</p>
            </div>
            <div className="flex justify-around mx-6 my-4 bg-white/5 rounded-2xl p-3">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Amount Lost</p>
                <p className="text-sm font-bold text-rose-400">GH₵{bet.stake.toFixed(2)}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Total Odds</p>
                <p className="text-sm font-bold text-white">{bet.totalOdds.toFixed(2)}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Selections</p>
                <p className="text-sm font-bold text-white">{bet.selections.length}</p>
              </div>
            </div>
            {bet.selections.slice(0, 2).map((sel, i) => (
              <div key={i} className="mx-6 mb-2 px-3 py-2 bg-white/5 rounded-xl flex justify-between items-center">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-xs text-slate-500 truncate">{buildMatchLabel(sel as unknown as Record<string, unknown>)}</p>
                  <p className="text-xs font-semibold text-white truncate">{sel.market}: {sel.selection}</p>
                </div>
                <span className="text-xs font-bold text-rose-400 shrink-0">
                  {sel.oddsLocked.toFixed(2)}
                  {sel.result && <SelectionResult result={sel.result} />}
                </span>
              </div>
            ))}
            {bet.selections.length > 2 && (
              <p className="text-center text-xs text-slate-500 mb-2">+{bet.selections.length - 2} more</p>
            )}
            <div className="px-6 pb-6 pt-3 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors">
                Try Again
              </button>
              <button
                onClick={handleShowOff}
                disabled={generatingImage}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                {generatingImage
                  ? <CircularProgress fontSize="small" className="animate-spin" />
                  : <><ShareIcon fontSize="small" /> Share</>}
              </button>
            </div>
          </div>
        </div>
      </div>
      {shareImageUrl && <ShareImageModal imageUrl={shareImageUrl} onClose={() => setShareImageUrl(null)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Bet detail bottom sheet
// ---------------------------------------------------------------------------
function BetDetailSheet({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const [showWin, setShowWin]   = useState(false);
  const [showLoss, setShowLoss] = useState(false);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden" />
          <div className="sticky top-0 bg-white dark:bg-slate-900 flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Bet Details</h3>
              <p className="text-xs text-slate-400 mt-0.5">#{bet.id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={bet.status} />
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <CloseIcon fontSize="small" />
              </button>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2">
            {bet.selections.map((sel, i) => (
              <div key={sel.id ?? i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-xs text-slate-400 truncate">{buildMatchLabel(sel as unknown as Record<string, unknown>)}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {sel.market}: {sel.selection}
                    <SelectionResult result={sel.result} />
                  </p>
                </div>
                <span className="font-bold text-primary text-sm shrink-0">{sel.oddsLocked.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 mx-5" />
          <div className="px-5 py-4 space-y-2.5">
            {[
              { label: 'Stake',            value: formatCurrency(bet.stake) },
              { label: 'Total Odds',       value: bet.totalOdds.toFixed(2) },
              { label: 'Potential Return', value: formatCurrency(bet.potentialReturn), highlight: true },
              { label: 'Placed At',        value: new Date(bet.placedAt).toLocaleString('en-GH') },
              ...(bet.settledAt ? [{ label: 'Settled At', value: new Date(bet.settledAt).toLocaleString('en-GH') }] : []),
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between items-center text-sm">
                <span className="text-slate-400">{label}</span>
                <span className={`font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
          {(bet.status === 'WON' || bet.status === 'LOST') && (
            <div className="px-5 pb-6 pt-1">
              <button
                onClick={() => bet.status === 'WON' ? setShowWin(true) : setShowLoss(true)}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                  bet.status === 'WON'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {bet.status === 'WON' ? '🏆 View Winnings' : '😭 View Result'}
              </button>
            </div>
          )}
          {bet.status === 'VOID' && (
            <div className="px-5 pb-6 pt-1">
              <div className="w-full py-3 px-4 rounded-xl text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-center">
                ↩ Stake refunded to your wallet
              </div>
            </div>
          )}
        </div>
      </div>
      {showWin  && <WinModal  bet={bet} onClose={() => { setShowWin(false);  onClose(); }} />}
      {showLoss && <LossModal bet={bet} onClose={() => { setShowLoss(false); onClose(); }} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Booking code panel
// ---------------------------------------------------------------------------
function BookingCodePanel() {
  const { clearBetSlip, addToBetSlip, showToast, user } = useAppStore();
  const navigate = useNavigate();
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [preview, setPreview]   = useState<any>(null);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleLoad = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    log('BookingCode', 'Loading booking code:', code.trim().toUpperCase());
    try {
      const res = await booking.redeem({ code: code.trim().toUpperCase() });
      log('BookingCode', '📦 Raw API response:', res);
      if (res.success && res.data) {
        const selections = res.data.enrichedSelections ?? [];
        console.group(`%c[Futball:BookingCode] ✅ Loaded ${selections.length} selection(s)`, 'color:#22c55e;font-weight:bold');
        selections.forEach((sel: Record<string, unknown>, i: number) => {
          console.log(`Selection ${i + 1}:`, JSON.stringify(sel, null, 2));
          const oddsFields = ['currentOdds','oddsLocked','odds','value','odd','price','oddsValue','rate'];
          const found = oddsFields.filter(k => sel[k] !== undefined && sel[k] !== null);
          console.log(`  Odds fields present: [${found.join(', ')}]`);
          found.forEach(k => console.log(`    ${k} =`, sel[k], `(Number: ${Number(sel[k])})`));
          const extracted = extractOdds(sel);
          console.log(`  → extractOdds result:`, extracted);
        });
        console.log('Booking meta:', JSON.stringify(res.data.booking ?? {}, null, 2));
        console.groupEnd();
        setPreview(res.data);
      } else {
        logWarn('BookingCode', 'API returned success=false or no data:', res);
        setError('Invalid or expired booking code.');
      }
    } catch (err: unknown) {
      logError('BookingCode', 'Request failed:', err);
      setError(err instanceof Error ? err.message : 'Invalid booking code.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSlip = () => {
    if (!preview) return;
    if (!user) {
      showToast('Log in to place this bet', 'info');
      navigate('/login');
      return;
    }
    const enriched: Record<string, unknown>[] = preview.enrichedSelections ?? [];
    log('BookingCode', 'Adding to slip. Raw enriched selections:', enriched);
    const mapped = enriched.map((s) => {
      const odds    = extractOdds(s);
      const matchId = String(s.matchId ?? s.match_id ?? s.fixtureId ?? s.fixture_id ?? '');
      const selection = String(s.selection ?? s.pick ?? s.name ?? s.label ?? '');
      return { matchId, matchName: buildMatchLabel(s), market: String(s.market ?? s.marketKey ?? ''), selection, odd: odds };
    });
    clearBetSlip();
    mapped.forEach((sel: any) => addToBetSlip(sel));
    showToast(`Booking code loaded — ${mapped.length} selections added!`, 'success');
    log('BookingCode', `✅ ${mapped.length} selections added to slip`);
    setPreview(null);
    setCode('');
  };

  const selectionCount = (preview?.enrichedSelections ?? []).length;
  const totalOdds      = preview?.currentTotalOdds ?? preview?.booking?.totalOdds ?? 0;

  return (
    <div className="mt-2">
      {!expanded && !preview && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full group flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-primary/[0.03] transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0">
            <QrCodeIcon sx={{ fontSize: 16 }} className="text-slate-400 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Have a booking code?</p>
            <p className="text-xs text-slate-400">Tap to load selections instantly</p>
          </div>
          <svg className="ml-auto shrink-0 text-slate-300 group-hover:text-primary transition-colors" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {(expanded || preview) && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <QrCodeIcon sx={{ fontSize: 13 }} className="text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Booking Code</span>
            </div>
            {!preview && (
              <button onClick={() => { setExpanded(false); setError(null); setCode(''); }} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <CloseIcon sx={{ fontSize: 15 }} />
              </button>
            )}
          </div>

          {!preview && (
            <div className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={code}
                    onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
                    placeholder="e.g. ABC12345"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono tracking-widest uppercase bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none transition-all focus:ring-2 ${
                      error
                        ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-200 dark:focus:ring-rose-900/50'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-primary/20 focus:border-primary/50'
                    }`}
                    disabled={loading}
                    onKeyDown={e => e.key === 'Enter' && handleLoad()}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleLoad}
                  disabled={loading || !code.trim()}
                  className="px-5 py-3 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all active:scale-95 shrink-0 flex items-center gap-2"
                >
                  {loading ? <CircularProgress sx={{ fontSize: 16 }} className="animate-spin" /> : 'Load'}
                </button>
              </div>
              {error && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-500">
                  <InfoOutlinedIcon sx={{ fontSize: 13 }} />
                  <span>{error}</span>
                </div>
              )}
              {!user && (
                <p className="mt-2.5 text-xs text-slate-400 flex items-center gap-1.5">
                  <InfoOutlinedIcon sx={{ fontSize: 13 }} />
                  You can preview without logging in.{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
                  {' '}to place the bet.
                </p>
              )}
            </div>
          )}

          {preview && (
            <>
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-base font-black tracking-widest text-slate-800 dark:text-white">
                      {preview.booking?.code ?? code}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Valid</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectionCount} selection{selectionCount !== 1 ? 's' : ''} · Odds:{' '}
                    <span className="font-bold text-primary">{totalOdds.toFixed(2)}x</span>
                  </p>
                </div>
                <button onClick={() => { setPreview(null); setCode(''); setExpanded(true); }} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors shrink-0">
                  <CloseIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
              <div className="relative mx-4 my-1">
                <div className="border-t border-dashed border-slate-200 dark:border-slate-700" />
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700" />
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700" />
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 px-1">
                {(preview.enrichedSelections ?? []).map((sel: Record<string, unknown>, i: number) => {
                  const odds = extractOdds(sel);
                  return (
                    <div key={i} className="px-3 py-2.5 flex justify-between items-center">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-[11px] text-slate-400 truncate mb-0.5">{buildMatchLabel(sel)}</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {String(sel.market ?? '')}
                          <span className="text-slate-400 font-normal mx-1">·</span>
                          {String(sel.selection ?? '')}
                        </p>
                      </div>
                      <span className="text-xs font-black text-primary shrink-0 bg-primary/8 dark:bg-primary/15 px-2 py-1 rounded-lg">
                        {odds > 1 ? odds.toFixed(2) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="relative mx-4 my-1">
                <div className="border-t border-dashed border-slate-200 dark:border-slate-700" />
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700" />
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700" />
              </div>
              <div className="px-4 pb-4 pt-3">
                <button
                  onClick={handleAddToSlip}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary/20"
                >
                  <CheckCircleIcon sx={{ fontSize: 17 }} />
                  {user
                    ? `Add ${selectionCount} Selection${selectionCount !== 1 ? 's' : ''} to Slip`
                    : `Log in & Add ${selectionCount} Selection${selectionCount !== 1 ? 's' : ''}`}
                </button>
                {!user && (
                  <p className="text-center text-xs text-slate-400 mt-2">You'll be taken to the login page</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slip tab — with IP-based currency detection + GH₵300 minimum stake
// ---------------------------------------------------------------------------
function SlipTab() {
  const { betSlip, removeFromBetSlip, clearBetSlip, showToast, user } = useAppStore();
  const navigate = useNavigate();

  const [stakeInput, setStakeInput]             = useState('');
  const [placing, setPlacing]                   = useState(false);
  const [placed, setPlaced]                     = useState(false);
  const [walletBalance, setWalletBalance]       = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading]     = useState(false);
  const [currency, setCurrency]                 = useState<CurrencyInfo>(DEFAULT_CURRENCY);
  const [currencyLoading, setCurrencyLoading]   = useState(true);

  // Minimum stake in local currency (converted from GH₵300)
  const minStakeLocal = ghsToLocal(MIN_STAKE_GHS, currency);

  // Quick-add presets — sensible amounts in local currency based on min stake
  const QUICK_AMOUNTS = [
    minStakeLocal,
    minStakeLocal * 2,
    minStakeLocal * 5,
    minStakeLocal * 10,
  ].map(v => Math.round(v));

  // ── Detect currency once on mount ────────────────────────────────────────
  useEffect(() => {
    setCurrencyLoading(true);
    getCurrency()
      .then(c => {
        setCurrency(c);
        log('SlipTab', '✅ Currency set to:', c.code, `(1 GHS = ${c.rateToGHS} ${c.code})`);
      })
      .finally(() => setCurrencyLoading(false));
  }, []);

  // ── Fetch wallet balance ──────────────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    if (!user) return;
    setBalanceLoading(true);
    log('SlipTab', 'Fetching wallet balance...');
    try {
      const res = await walletApi.getWallet();
      log('SlipTab', 'Wallet response:', res);
      if (res.success && res.data) {
        const data = res.data as Record<string, unknown>;
        // Wallet is always in GHS on the backend
        const balGHS =
          typeof data.balance          === 'number' ? data.balance :
          typeof data.mainBalance      === 'number' ? data.mainBalance :
          typeof data.availableBalance === 'number' ? data.availableBalance :
          null;
        log('SlipTab', 'Balance (GHS):', balGHS, '| raw keys:', Object.keys(data));
        setWalletBalance(balGHS);
      }
    } catch (err) {
      logError('SlipTab', 'Failed to fetch wallet:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalOdds       = calculateTotalOdds(betSlip.map(s => s.odd));
  const parsedLocal     = parseFloat(stakeInput) || 0;
  const parsedGHS       = localToGHS(parsedLocal, currency);  // what we actually send to the API
  const potentialGHS    = calculatePotentialReturn(parsedGHS, totalOdds);
  const potentialLocal  = ghsToLocal(potentialGHS, currency);

  const walletGHS           = walletBalance ?? 0;
  const walletLocal         = ghsToLocal(walletGHS, currency);
  const belowMinStake       = parsedLocal > 0 && parsedLocal < minStakeLocal;
  const insufficientFunds   = parsedLocal > 0 && walletBalance !== null && parsedGHS > walletGHS;
  const canPlace            = !!user && parsedLocal >= minStakeLocal && !insufficientFunds && betSlip.length > 0;

  // ── Stake helpers ─────────────────────────────────────────────────────────
  const addToStake = (amount: number) => {
    const current = parseFloat(stakeInput) || 0;
    setStakeInput((current + amount).toFixed(currency.code === 'GHS' ? 2 : 0));
  };

  const setStakeToMin = () => {
    setStakeInput(minStakeLocal.toFixed(currency.code === 'GHS' ? 2 : 0));
  };

  // ── Place bet ─────────────────────────────────────────────────────────────
  const handlePlace = async () => {
    if (!user) { navigate('/login'); return; }
    if (parsedGHS < MIN_STAKE_GHS) {
      showToast(`Minimum stake is ${formatLocal(minStakeLocal, currency)}`, 'error');
      return;
    }
    setPlacing(true);
    log('SlipTab', `Placing bet. Stake: ${parsedLocal} ${currency.code} = ${parsedGHS.toFixed(2)} GHS`);

    try {
      const verifiedSelections = await Promise.all(
        betSlip.map(async (s) => {
          if (!s.matchId) {
            log('SlipTab', `Skipping odds verification for "${s.market}: ${s.selection}" (no matchId) — using stored odd: ${s.odd}`);
            return { matchId: s.matchId, market: s.market, selection: s.selection, submittedOdds: Number(s.odd) };
          }
          log('SlipTab', `Verifying odds for matchId=${s.matchId} market=${s.market} selection=${s.selection}`);
          try {
            const res = await publicMatches.odds(s.matchId);
            if (res.success && Array.isArray(res.data)) {
              const match = res.data.find(
                (o: any) =>
                  (o.market === s.market || o.marketKey === s.market) &&
                  (o.selection === s.selection || o.name === s.selection)
              );
              return {
                matchId:       s.matchId,
                market:        s.market,
                selection:     s.selection,
                submittedOdds: match ? Number(match.value ?? match.odds ?? s.odd) : Number(s.odd),
              };
            }
          } catch (err) {
            logWarn('SlipTab', `Odds fetch failed for ${s.matchId}:`, err, '— using stored odd:', s.odd);
          }
          return { matchId: s.matchId, market: s.market, selection: s.selection, submittedOdds: Number(s.odd) };
        })
      );

      const payload = {
        stake:      parsedGHS,   // always submit in GHS
        currency:   'GHS',
        selections: verifiedSelections.map(s => ({
          matchId:       s.matchId,
          fixtureId:     s.matchId,
          market:        s.market,
          selection:     s.selection,
          submittedOdds: s.submittedOdds,
        })) as any,
      };

      console.log('%c[Futball:SlipTab] 📤 Sending bet payload:', 'color:#3b82f6;font-weight:bold', JSON.stringify(payload, null, 2));

      const res = await betsApi.place(payload);
      log('SlipTab', '📥 Place bet response:', res);

      if (res.success) {
        clearBetSlip();
        setStakeInput('');
        setPlaced(true);
        showToast('Bet placed successfully!', 'success');
        fetchBalance();
      } else {
        logWarn('SlipTab', 'API returned success=false:', res);
        throw new Error((res as any).message ?? 'Failed to place bet.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place bet.';
      logError('SlipTab', '❌ Place bet error:', msg);
      showToast(msg, 'error');
    } finally {
      setPlacing(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (placed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
          <CheckCircleIcon className="text-emerald-600" sx={{ fontSize: 36 }} />
        </div>
        <p className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">Bet Placed!</p>
        <p className="text-sm text-slate-400 mb-6">Check My Bets for updates.</p>
        <button onClick={() => setPlaced(false)} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
          New Bet
        </button>
      </div>
    );
  }

  // ── Empty slip ────────────────────────────────────────────────────────────
  if (betSlip.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <ReceiptLongIcon className="text-slate-400" sx={{ fontSize: 28 }} />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Your slip is empty</p>
        <p className="text-sm text-slate-400 mb-6">Tap any odds on the matches page to add selections</p>
        <Link to="/" className="btn-primary px-5 py-2.5 text-sm rounded-xl flex items-center gap-2">
          <SportsSoccerIcon fontSize="small" /> Browse Matches
        </Link>
        <div className="w-full mt-6">
          <BookingCodePanel />
        </div>
      </div>
    );
  }

  // ── Main slip UI ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Selections list */}
      <div className="space-y-2">
        {betSlip.map(sel => (
          <div
            key={`${sel.matchId}-${sel.market}-${sel.selection}`}
            className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs text-slate-400 truncate mb-0.5">{sel.matchName}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {sel.market}: {sel.selection}
              </p>
              <p className="text-sm font-bold text-primary mt-0.5">{sel.odd.toFixed(2)}</p>
            </div>
            <button
              onClick={() => removeFromBetSlip(sel.matchId, sel.market, sel.selection)}
              className="p-2 text-slate-300 hover:text-rose-500 active:scale-90 transition-all rounded-lg"
            >
              <DeleteIcon fontSize="small" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Stake card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">

        {/* Header row: label + currency pill */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Stake</p>
          <CurrencyPill currency={currency} detecting={currencyLoading} />
        </div>

        {/* Quick-add buttons — show detected currency amounts */}
        <div className="flex gap-1.5 mb-3">
          {QUICK_AMOUNTS.map((amount, idx) => (
            <button
              key={idx}
              onClick={() => addToStake(amount)}
              className="flex-1 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary text-slate-600 dark:text-slate-400 rounded-xl transition-colors"
            >
              +{currency.symbol}{amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount}
            </button>
          ))}
          <button
            onClick={() => setStakeInput('')}
            className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stake input */}
        <div className="relative mb-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none select-none">
            {currency.symbol}
          </span>
          <input
            type="number"
            value={stakeInput}
            onChange={e => setStakeInput(e.target.value)}
            placeholder={`Min ${formatLocal(minStakeLocal, currency, 0)}`}
            className={`input-field pl-9 pr-4 ${
              belowMinStake
                ? 'border-amber-400 dark:border-amber-600 focus:ring-amber-300'
                : insufficientFunds
                ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-300'
                : ''
            }`}
            min={0}
            step={currency.code === 'GHS' ? '0.01' : '1'}
          />
        </div>

        {/* Inline helper text */}
        {belowMinStake && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <InfoOutlinedIcon sx={{ fontSize: 13 }} />
              Minimum stake is {formatLocal(minStakeLocal, currency, 0)}
            </p>
            <button
              onClick={setStakeToMin}
              className="text-xs font-bold text-primary hover:underline"
            >
              Use min
            </button>
          </div>
        )}
        {insufficientFunds && !belowMinStake && (
          <p className="mb-3 text-xs text-rose-500 flex items-center gap-1">
            <InfoOutlinedIcon sx={{ fontSize: 13 }} />
            Insufficient balance · available {formatLocal(walletLocal, currency, 0)}
          </p>
        )}
        {!belowMinStake && !insufficientFunds && <div className="mb-3" />}

        {/* Non-GHS conversion hint */}
        {!currencyLoading && currency.code !== 'GHS' && parsedLocal > 0 && (
          <div className="mb-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 flex items-center gap-1.5">
            <PublicIcon sx={{ fontSize: 13 }} />
            {formatLocal(parsedLocal, currency)} ≈ <span className="font-semibold text-slate-700 dark:text-slate-300">GH₵{parsedGHS.toFixed(2)}</span>
            <span className="ml-auto text-slate-400">settled in GH₵</span>
          </div>
        )}

        {/* Summary rows */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{betSlip.length} selection{betSlip.length !== 1 ? 's' : ''}</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{totalOdds.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Potential return</span>
            <span className="font-bold text-emerald-600">
              {parsedLocal > 0
                ? currency.code !== 'GHS'
                  ? `${formatLocal(potentialLocal, currency)} (GH₵${potentialGHS.toFixed(2)})`
                  : formatLocal(potentialGHS, currency)
                : '—'}
            </span>
          </div>

          {/* Live balance — shown when logged in, converted to local currency */}
          {user && (
            <div className="flex justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Wallet balance</span>
              <span className="text-slate-500 font-medium">
                {balanceLoading
                  ? '…'
                  : walletBalance !== null
                    ? currency.code !== 'GHS'
                      ? `${formatLocal(walletLocal, currency, 0)} (GH₵${walletGHS.toFixed(2)})`
                      : `GH₵${walletGHS.toFixed(2)}`
                    : '–'}
              </span>
            </div>
          )}
        </div>

        {/* Place bet / login CTA */}
        {user ? (
          <button
            onClick={handlePlace}
            disabled={!canPlace || placing}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              canPlace && !placing
                ? 'bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {placing ? (
              <>
                <CircularProgress fontSize="small" className="animate-spin" />
                Placing Bet…
              </>
            ) : parsedLocal > 0 && canPlace ? (
              <>
                Place Bet · {currency.code !== 'GHS'
                  ? `${formatLocal(parsedLocal, currency)} (GH₵${parsedGHS.toFixed(2)})`
                  : `GH₵${parsedGHS.toFixed(2)}`}
              </>
            ) : (
              <>
                Place Bet{' '}
                {belowMinStake
                  ? `· min ${formatLocal(minStakeLocal, currency, 0)}`
                  : parsedLocal === 0
                  ? `· enter stake`
                  : ''}
              </>
            )}
          </button>
        ) : (
          <Link
            to="/login"
            className="btn-primary w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <LoginIcon fontSize="small" /> Log In to Bet
          </Link>
        )}

        <button
          onClick={clearBetSlip}
          className="w-full mt-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
        >
          Clear slip
        </button>
      </div>

      <BookingCodePanel />
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Bets tab
// ---------------------------------------------------------------------------
type BetsFilter = 'ALL' | 'PENDING' | 'WON' | 'LOST' | 'VOID';

const EMPTY_STATE: Record<BetsFilter, { emoji: string; label: string; sub: string }> = {
  ALL:     { emoji: '🏟️', label: 'No bets yet',    sub: 'Your bets will appear here once you start playing.' },
  PENDING: { emoji: '⏳', label: 'No active bets',  sub: 'Placed bets appear here while they are in progress.' },
  WON:     { emoji: '🏆', label: 'No wins yet',     sub: 'Your winning slips will land here.' },
  LOST:    { emoji: '👋', label: 'No losses',       sub: "Bets that didn't hit show here." },
  VOID:    { emoji: '↩️', label: 'No voided bets',  sub: 'Refunded bets appear here.' },
};

function MyBetsTab() {
  const { user } = useAppStore();
  const [apiBets, setApiBets]       = useState<Bet[]>([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter]         = useState<BetsFilter>('ALL');
  const [detailBet, setDetailBet]   = useState<Bet | null>(null);
  const [unseenWins, setUnseenWins] = useState<Bet[]>([]);
  const [winPopup, setWinPopup]     = useState<Bet | null>(null);
  const didCheckUnseen = useRef(false);

  const normalisedBets = apiBets.map(normaliseBet);
  const totalStaked    = normalisedBets.reduce((s, b) => s + (b.stake ?? 0), 0);
  const totalWon       = normalisedBets.filter(b => b.status === 'WON').reduce((s, b) => s + (b.potentialReturn ?? 0), 0);
  const settledBets    = normalisedBets.filter(b => b.status !== 'PENDING');
  const winRate        = settledBets.length
    ? Math.round((normalisedBets.filter(b => b.status === 'WON').length / settledBets.length) * 100)
    : 0;

  const fetchBets = useCallback(async (p = 0) => {
    if (!user) return;
    setLoading(true);
    log('MyBets', `Fetching bets page ${p}...`);
    try {
      const res = await betsApi.getMyBets(p, 10);
      if (res.success) {
        setApiBets(prev => p === 0 ? res.data.content : [...prev, ...res.data.content]);
        setTotalPages(res.data.totalPages);
        setPage(p);
      } else {
        logWarn('MyBets', 'API returned success=false:', res);
      }
    } catch (err) {
      logError('MyBets', 'Failed to fetch bets:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkUnseenWins = useCallback(async () => {
    if (!user || didCheckUnseen.current) return;
    didCheckUnseen.current = true;
    try {
      const res = await betsApi.getUnseenWins();
      if (res.success && res.data.length > 0) {
        log('MyBets', `🏆 Found ${res.data.length} unseen win(s)!`);
        setUnseenWins(res.data);
        setWinPopup(res.data[0]);
      }
    } catch (err) {
      logWarn('MyBets', 'checkUnseenWins failed (non-critical):', err);
    }
  }, [user]);

  useEffect(() => { fetchBets(0); checkUnseenWins(); }, [fetchBets, checkUnseenWins]);

  const dismissWin = async (bet: Bet) => {
    try { await betsApi.dismissWin(bet.id); } catch (err) { logWarn('MyBets', 'dismissWin failed:', err); }
    const remaining = unseenWins.filter(b => b.id !== bet.id);
    setUnseenWins(remaining);
    setWinPopup(remaining[0] ?? null);
  };

  if (!user) return <GuestPrompt message="Log in to view your bets" />;

  const filtered = filter === 'ALL' ? normalisedBets : normalisedBets.filter(b => b.status === filter);

  const FILTERS: { key: BetsFilter; label: string }[] = [
    { key: 'ALL',     label: `All (${normalisedBets.length})` },
    { key: 'PENDING', label: 'Open' },
    { key: 'WON',     label: 'Won' },
    { key: 'LOST',    label: 'Lost' },
    { key: 'VOID',    label: 'Void' },
  ];

  return (
    <div className="space-y-3">
      {/* Stats header */}
      {normalisedBets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="shrink-0 flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Staked</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(totalStaked)}</p>
          </div>
          <div className="shrink-0 flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Won</p>
            <p className="text-sm font-bold text-emerald-600 font-mono">{formatCurrency(totalWon)}</p>
          </div>
          <div className="shrink-0 flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Win Rate</p>
            <p className="text-sm font-bold text-primary font-mono">{winRate ? `${winRate}%` : '—'}</p>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => fetchBets(0)}
          className="shrink-0 ml-auto p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors"
          title="Refresh"
        >
          <RefreshIcon sx={{ fontSize: 16 }} />
        </button>
      </div>

      {/* Loading skeletons */}
      {loading && apiBets.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
              <div className="flex justify-between mb-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-3 w-full mb-1.5" />
              <Skeleton className="h-3 w-3/4 mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">{EMPTY_STATE[filter].emoji}</span>
          <p className="font-semibold text-slate-500">{EMPTY_STATE[filter].label}</p>
          <p className="text-sm text-slate-400 mt-1">{EMPTY_STATE[filter].sub}</p>
          {filter === 'ALL' && (
            <Link to="/" className="mt-6 btn-primary px-5 py-2.5 text-sm rounded-xl flex items-center gap-2">
              <SportsSoccerIcon fontSize="small" /> Browse Matches
            </Link>
          )}
        </div>
      )}

      {/* Bet cards */}
      {filtered.map(bet => {
        const isWon  = bet.status === 'WON';
        const isLost = bet.status === 'LOST';
        const isVoid = bet.status === 'VOID';
        return (
          <button
            key={bet.id}
            onClick={() => setDetailBet(bet)}
            className={`w-full text-left bg-white dark:bg-slate-900 rounded-2xl border transition-all active:scale-[0.98] p-4 ${
              isWon  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/10'
            : isLost ? 'border-slate-100 dark:border-slate-800 opacity-70'
            : isVoid ? 'border-blue-100 dark:border-blue-900/40 opacity-70'
                     : 'border-slate-100 dark:border-slate-800 hover:border-primary/20'
            }`}
          >
            <div className="flex justify-between items-start mb-2.5">
              <div>
                <p className="text-xs text-slate-400">
                  {new Date(bet.placedAt).toLocaleDateString('en-GH', { day: '2-digit', month: 'short' })}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {bet.selections.length} selection{bet.selections.length !== 1 ? 's' : ''}
                </p>
              </div>
              <StatusBadge status={bet.status} />
            </div>
            <div className="space-y-1 mb-3">
              {bet.selections.slice(0, 2).map((sel: BetSelection, i: number) => (
                <p key={sel.id ?? i} className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {buildMatchLabel(sel as unknown as Record<string, unknown>)} ·{' '}
                  <span className="font-medium">{sel.selection}</span>
                  <SelectionResult result={sel.result} />
                </p>
              ))}
              {bet.selections.length > 2 && (
                <p className="text-xs text-slate-400">+{bet.selections.length - 2} more</p>
              )}
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Stake</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(bet.stake)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Return</p>
                <p className={`text-sm font-bold ${isWon ? 'text-emerald-600' : isVoid ? 'text-blue-500' : 'text-slate-500'}`}>
                  {isVoid ? formatCurrency(bet.stake) : formatCurrency(bet.potentialReturn)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Odds</p>
                <p className="text-sm font-bold text-primary">{bet.totalOdds.toFixed(2)}x</p>
              </div>
            </div>
          </button>
        );
      })}

      {/* Load more */}
      {page < totalPages - 1 && !loading && (
        <button
          onClick={() => fetchBets(page + 1)}
          className="w-full py-3 text-sm font-semibold text-primary border border-primary/20 rounded-2xl hover:bg-primary/5 transition-colors"
        >
          Load More
        </button>
      )}
      {loading && apiBets.length > 0 && (
        <div className="flex justify-center py-4">
          <CircularProgress className="text-primary animate-spin" fontSize="small" />
        </div>
      )}

      {detailBet && <BetDetailSheet bet={detailBet} onClose={() => setDetailBet(null)} />}
      {winPopup   && <WinModal bet={winPopup} onClose={() => dismissWin(winPopup)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function BetSlipPage() {
  const { betSlip, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'slip' | 'bets'>('slip');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-lg mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('slip')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'slip'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <ReceiptLongIcon sx={{ fontSize: 18 }} />
              Bet Slip
              {betSlip.length > 0 && (
                <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {betSlip.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('bets')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'bets'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <HistoryIcon sx={{ fontSize: 18 }} />
              My Bets
              {!user && (
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-medium">
                  Login
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {activeTab === 'slip' ? <SlipTab /> : <MyBetsTab />}
      </div>
    </div>
  );
}