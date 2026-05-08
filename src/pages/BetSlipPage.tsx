import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatCurrency, calculateTotalOdds, calculatePotentialReturn } from '../utils';
import { bets as betsApi, booking } from '../utils/api';
import type { Bet, BetSelection } from '../utils/api';

import html2canvas from 'html2canvas';

import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cfg: Record<string, string> = {
    won:       'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    lost:      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    pending:   'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    void:      'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    cashed_out:'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
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
  // Create an off-screen container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 380px;
    background: #0f172a;
    border-radius: 24px;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
  `;

  const winColor = '#22c55e';
  const lossColor = '#ef4444';
  const accentColor = isWin ? winColor : lossColor;
  const emoji = isWin ? '🏆' : '😭';

  container.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    </style>
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 0;">
      <!-- Header band -->
      <div style="background: ${accentColor}; padding: 6px 20px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 11px; font-weight: 800; color: #fff; letter-spacing: 2px; text-transform: uppercase;">FUTBALL</span>
        <span style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8);">Bet Slip</span>
      </div>

      <!-- Big result -->
      <div style="padding: 28px 24px 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 8px;">${emoji}</div>
        <div style="font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 6px;">
          ${isWin ? 'YOU WON' : 'BETTER LUCK NEXT TIME'}
        </div>
        <div style="font-size: 38px; font-weight: 900; color: ${accentColor}; line-height: 1;">
          ${isWin ? `GH₵${bet.potentialReturn.toFixed(2)}` : `GH₵${bet.stake.toFixed(2)}`}
        </div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 6px;">
          ${isWin ? `Stake: GH₵${bet.stake.toFixed(2)} · Odds: ${bet.totalOdds.toFixed(2)}` : `Odds: ${bet.totalOdds.toFixed(2)}`}
        </div>
      </div>

      <!-- Divider -->
      <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 0 24px;"></div>

      <!-- Selections -->
      <div style="padding: 16px 24px; display: flex; flex-direction: column; gap: 10px;">
        ${bet.selections.map(sel => `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${sel.homeTeam ? `${sel.homeTeam} vs ${sel.awayTeam}` : sel.matchId}
              </div>
              <div style="font-size: 13px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${sel.market}: ${sel.selection}
              </div>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: ${accentColor}; white-space: nowrap; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 6px;">
              ${sel.oddsLocked.toFixed(2)}
              ${sel.result ? `<span style="color: ${sel.result === 'WON' ? winColor : lossColor}; margin-left: 4px;">${sel.result === 'WON' ? '✓' : '✗'}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Divider -->
      <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 0 24px;"></div>

      <!-- Stats row -->
      <div style="padding: 14px 24px; display: flex; justify-content: space-between;">
        <div style="text-align: center;">
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px;">Stake</div>
          <div style="font-size: 14px; font-weight: 700; color: #fff;">GH₵${bet.stake.toFixed(2)}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px;">Total Odds</div>
          <div style="font-size: 14px; font-weight: 700; color: ${accentColor};">${bet.totalOdds.toFixed(2)}x</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px;">Return</div>
          <div style="font-size: 14px; font-weight: 700; color: ${accentColor};">GH₵${bet.potentialReturn.toFixed(2)}</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: rgba(0,0,0,0.3); padding: 12px 24px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 10px; color: rgba(255,255,255,0.3);">
          ${new Date(bet.placedAt).toLocaleString('en-GH')}
        </div>
        <div style="font-size: 11px; font-weight: 800; color: ${accentColor}; letter-spacing: 1px;">FUTBALL</div>
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
      const res = await fetch(imageUrl);
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
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
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
// Win celebration modal — Futball branded
// ---------------------------------------------------------------------------
function WinModal({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const [generatingImage, setGeneratingImage] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  const confettiColors = ['#E6192E', '#FFD700', '#22C55E', '#3B82F6', '#F59E0B', '#A855F7'];

  const handleShowOff = async () => {
    setGeneratingImage(true);
    try {
      const url = await generateSlipImage(bet, true);
      setShareImageUrl(url);
    } catch {
      // fallback: just try native share
      if (navigator.share) {
        await navigator.share({ title: `I won GH₵${bet.potentialReturn.toFixed(2)} on Futball! 🏆`, text: `Stake: GH₵${bet.stake} · Odds: ${bet.totalOdds.toFixed(2)}x` });
      }
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-8px',
                backgroundColor: confettiColors[i % confettiColors.length],
                borderRadius: i % 3 === 0 ? '50%' : '2px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl">
          {/* Dark gradient bg with green accent top */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />

            {/* Close */}
            <div className="flex justify-end px-4 pt-3">
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>

            {/* Futball logo */}
            <div className="flex justify-center mt-1 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <SportsSoccerIcon sx={{ fontSize: 18 }} className="text-white" />
                </div>
                <span className="text-white font-black text-lg tracking-tight">FUTBALL</span>
              </div>
            </div>

            {/* Trophy icon */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.5)]">
                  <EmojiEventsIcon sx={{ fontSize: 52 }} className="text-amber-900" />
                </div>
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 scale-110 animate-ping" />
              </div>
            </div>

            {/* YOU WON text */}
            <div className="text-center px-6 pb-2">
              <p className="text-xs font-bold tracking-[4px] uppercase text-emerald-400 mb-1">YOU WON</p>
              <p className="text-5xl font-black text-white mb-1">
                GH₵{bet.potentialReturn.toFixed(2)}
              </p>
              <p className="text-slate-400 text-sm mb-1">${formatCurrency(bet.potentialReturn)}</p>
            </div>

            {/* Stats row */}
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

            {/* Selections preview */}
            {bet.selections.slice(0, 2).map((sel, i) => (
              <div key={i} className="mx-6 mb-2 px-3 py-2 bg-white/5 rounded-xl flex justify-between items-center">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-xs text-slate-500 truncate">{sel.homeTeam} vs {sel.awayTeam}</p>
                  <p className="text-xs font-semibold text-white truncate">{sel.market}: {sel.selection}</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 shrink-0">{sel.oddsLocked.toFixed(2)}</span>
              </div>
            ))}
            {bet.selections.length > 2 && (
              <p className="text-center text-xs text-slate-500 mb-2">+{bet.selections.length - 2} more selections</p>
            )}

            {/* Action buttons */}
            <div className="px-6 pb-6 pt-3 flex gap-3">
              <button
                onClick={handleShowOff}
                disabled={generatingImage}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {generatingImage
                  ? <><CircularProgress fontSize="small" className="animate-spin" /> Generating…</>
                  : <><ShareIcon fontSize="small" /> Show Off</>
                }
              </button>
              <Link
                to="/wallet"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white text-sm font-bold flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                Withdraw
              </Link>
            </div>

            <button
              onClick={onClose}
              className="w-full pb-5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Continue Betting
            </button>
          </div>
        </div>
      </div>

      {shareImageUrl && (
        <ShareImageModal imageUrl={shareImageUrl} onClose={() => setShareImageUrl(null)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Loss modal — cringe emoji, amount lost
// ---------------------------------------------------------------------------
function LossModal({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const [generatingImage, setGeneratingImage] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  const handleShowOff = async () => {
    setGeneratingImage(true);
    try {
      const url = await generateSlipImage(bet, false);
      setShareImageUrl(url);
    } catch {
      // ignore
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            {/* Top accent bar — red for loss */}
            <div className="h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500" />

            {/* Close */}
            <div className="flex justify-end px-4 pt-3">
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>

            {/* Futball logo */}
            <div className="flex justify-center mt-1 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <SportsSoccerIcon sx={{ fontSize: 18 }} className="text-white" />
                </div>
                <span className="text-white font-black text-lg tracking-tight">FUTBALL</span>
              </div>
            </div>

            {/* Cringe emoji big */}
            <div className="flex justify-center mb-3">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                😭
              </div>
            </div>

            {/* Text */}
            <div className="text-center px-6 pb-2">
              <p className="text-xs font-bold tracking-[3px] uppercase text-rose-400 mb-1">BETTER LUCK NEXT TIME</p>
              <p className="text-4xl font-black text-white mb-1">GH₵{bet.stake.toFixed(2)}</p>
              <p className="text-slate-500 text-sm">That one hurts 😬</p>
            </div>

            {/* Stats */}
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

            {/* Selections that lost */}
            {bet.selections.slice(0, 2).map((sel, i) => (
              <div key={i} className="mx-6 mb-2 px-3 py-2 bg-white/5 rounded-xl flex justify-between items-center">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-xs text-slate-500 truncate">{sel.homeTeam} vs {sel.awayTeam}</p>
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

            {/* Buttons */}
            <div className="px-6 pb-6 pt-3 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleShowOff}
                disabled={generatingImage}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                {generatingImage
                  ? <CircularProgress fontSize="small" className="animate-spin" />
                  : <><ShareIcon fontSize="small" /> Share</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {shareImageUrl && (
        <ShareImageModal imageUrl={shareImageUrl} onClose={() => setShareImageUrl(null)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Bet detail bottom sheet
// ---------------------------------------------------------------------------
function BetDetailSheet({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const [showWin, setShowWin] = useState(false);
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
          {/* Handle */}
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
                  <p className="text-xs text-slate-400 truncate">{sel.homeTeam} vs {sel.awayTeam}</p>
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
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between items-center text-sm">
                <span className="text-slate-400">{label}</span>
                <span className={`font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'}`}>{value}</span>
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
  const { clearBetSlip, addToBetSlip, showToast } = useAppStore();
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await booking.redeem({ code: code.trim().toUpperCase() });
      if (res.success && res.data) {
        const enriched = res.data.enrichedSelections ?? [];
        const mapped = enriched.map((s: Record<string, unknown>) => ({
          matchId:   String(s.matchId ?? ''),
          matchName: `${s.homeTeam ?? ''} vs ${s.awayTeam ?? ''}`,
          market:    String(s.market ?? ''),
          selection: String(s.selection ?? ''),
          odd:       typeof s.oddsLocked === 'number' ? s.oddsLocked : Number(s.value ?? 0),
        }));
        clearBetSlip();
        mapped.forEach(sel => addToBetSlip(sel));
        setCode('');
        showToast(`Booking code loaded — ${mapped.length} selections added!`, 'success');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Invalid booking code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
        <QrCodeIcon sx={{ fontSize: 14 }} /> Booking Code
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC12345"
          className="input-field flex-1 font-mono tracking-widest uppercase"
          disabled={loading}
          onKeyDown={e => e.key === 'Enter' && handleRedeem()}
        />
        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors hover:bg-primary/90 shrink-0"
        >
          {loading ? <CircularProgress fontSize="small" className="animate-spin" /> : 'Load'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slip tab
// ---------------------------------------------------------------------------
function SlipTab() {
  const { betSlip, removeFromBetSlip, clearBetSlip, mainWalletBalance, showToast, user } = useAppStore();
  const navigate    = useNavigate();
  const [stake, setStake]         = useState('');
  const [placing, setPlacing]     = useState(false);
  const [placed, setPlaced]       = useState(false);
  const QUICK = [10, 20, 50, 100];

  const totalOdds      = calculateTotalOdds(betSlip.map(s => s.odd));
  const parsedStake    = parseFloat(stake) || 0;
  const potentialReturn = calculatePotentialReturn(parsedStake, totalOdds);
  const insufficientFunds = parsedStake > 0 && parsedStake > mainWalletBalance;
  const canPlace = !!user && parsedStake > 0 && !insufficientFunds && betSlip.length > 0;

  const handlePlace = async () => {
    if (!user) { navigate('/login'); return; }
    setPlacing(true);
    try {
      const payload = {
        stake: parsedStake,
        currency: 'GHS',
        selections: betSlip.map(s => ({
          matchId:       s.matchId,
          market:        s.market,
          selection:     s.selection,
          submittedOdds: s.odd,
        })),
      };
      const res = await betsApi.place(payload);
      if (res.success) {
        clearBetSlip();
        setStake('');
        setPlaced(true);
        showToast('Bet placed successfully!', 'success');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to place bet.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
          <CheckCircleIcon className="text-emerald-600" sx={{ fontSize: 36 }} />
        </div>
        <p className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">Bet Placed!</p>
        <p className="text-sm text-slate-400 mb-6">Check My Bets for updates.</p>
        <button onClick={() => setPlaced(false)} className="btn-primary px-6 py-2.5 rounded-xl text-sm">New Bet</button>
      </div>
    );
  }

  if (betSlip.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <ReceiptLongIcon className="text-slate-400" sx={{ fontSize: 28 }} />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Your slip is empty</p>
        <p className="text-sm text-slate-400 mb-6">Tap any odds on the matches page to add selections</p>
        <Link to="/" className="btn-primary px-5 py-2.5 text-sm rounded-xl flex items-center gap-2">
          <SportsSoccerIcon fontSize="small" /> Browse Matches
        </Link>
        {user && (
          <div className="w-full mt-6">
            <BookingCodePanel />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selections */}
      <div className="space-y-2">
        {betSlip.map(sel => (
          <div
            key={`${sel.matchId}-${sel.market}-${sel.selection}`}
            className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs text-slate-400 truncate mb-0.5">{sel.matchName}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{sel.market}: {sel.selection}</p>
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

      {/* Stake card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        {/* Quick stakes */}
        <div className="flex gap-1.5 mb-3">
          {QUICK.map(qs => (
            <button
              key={qs}
              onClick={() => setStake(prev => (parseFloat(prev || '0') + qs).toString())}
              className="flex-1 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary text-slate-600 dark:text-slate-400 rounded-xl transition-colors"
            >
              +{qs}
            </button>
          ))}
          <button
            onClick={() => setStake('')}
            className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>

        <input
          type="number"
          value={stake}
          onChange={e => setStake(e.target.value)}
          placeholder="Stake (GH₵)"
          className={`input-field mb-3 ${insufficientFunds ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-300' : ''}`}
          min="0"
          step="0.01"
        />

        {insufficientFunds && (
          <p className="text-xs text-rose-500 -mt-2 mb-3 flex items-center gap-1">
            <InfoOutlinedIcon sx={{ fontSize: 14 }} />
            Insufficient balance ({formatCurrency(mainWalletBalance)})
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{betSlip.length} selection{betSlip.length !== 1 ? 's' : ''}</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{totalOdds.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Potential return</span>
            <span className="font-bold text-emerald-600">{formatCurrency(potentialReturn)}</span>
          </div>
          {user && (
            <div className="flex justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Balance</span>
              <span className="text-slate-500 font-medium">{formatCurrency(mainWalletBalance)}</span>
            </div>
          )}
        </div>

        {user ? (
          <button
            onClick={handlePlace}
            disabled={!canPlace || placing}
            className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing
              ? <><CircularProgress fontSize="small" className="animate-spin" /> Placing Bet…</>
              : `Place Bet · ${formatCurrency(parsedStake || 0)}`
            }
          </button>
        ) : (
          <Link
            to="/login"
            className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
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

      {/* Booking code — only if logged in */}
      {user && <BookingCodePanel />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Bets tab
// ---------------------------------------------------------------------------
type BetsFilter = 'ALL' | 'PENDING' | 'WON' | 'LOST';

function MyBetsTab() {
  const { user } = useAppStore();
  const [apiBets, setApiBets]     = useState<Bet[]>([]);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter]       = useState<BetsFilter>('ALL');
  const [detailBet, setDetailBet] = useState<Bet | null>(null);
  const [unseenWins, setUnseenWins] = useState<Bet[]>([]);
  const [winPopup, setWinPopup]   = useState<Bet | null>(null);
  const didCheckUnseen = useRef(false);

  const fetchBets = useCallback(async (p = 0) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await betsApi.getMyBets(p, 10);
      if (res.success) {
        setApiBets(prev => p === 0 ? res.data.content : [...prev, ...res.data.content]);
        setTotalPages(res.data.totalPages);
        setPage(p);
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [user]);

  const checkUnseenWins = useCallback(async () => {
    if (!user || didCheckUnseen.current) return;
    didCheckUnseen.current = true;
    try {
      const res = await betsApi.getUnseenWins();
      if (res.success && res.data.length > 0) {
        setUnseenWins(res.data);
        setWinPopup(res.data[0]);
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { fetchBets(0); checkUnseenWins(); }, [fetchBets, checkUnseenWins]);

  const dismissWin = async (bet: Bet) => {
    try { await betsApi.dismissWin(bet.id); } catch { /* ignore */ }
    const remaining = unseenWins.filter(b => b.id !== bet.id);
    setUnseenWins(remaining);
    setWinPopup(remaining[0] ?? null);
  };

  if (!user) return <GuestPrompt message="Log in to view your bets" />;

  const filtered = filter === 'ALL' ? apiBets : apiBets.filter(b => b.status === filter);

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(['ALL', 'PENDING', 'WON', 'LOST'] as BetsFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40'
            }`}
          >
            {f === 'ALL' ? `All (${apiBets.length})` : f}
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
          {[1,2,3].map(i => (
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

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <HistoryIcon className="text-slate-300 dark:text-slate-600 mb-3" sx={{ fontSize: 40 }} />
          <p className="font-semibold text-slate-500">{filter === 'ALL' ? 'No bets yet' : `No ${filter.toLowerCase()} bets`}</p>
          <p className="text-sm text-slate-400 mt-1">Your bets will appear here</p>
        </div>
      )}

      {filtered.map(bet => {
        const isWon  = bet.status === 'WON';
        const isLost = bet.status === 'LOST';
        return (
          <button
            key={bet.id}
            onClick={() => setDetailBet(bet)}
            className={`w-full text-left bg-white dark:bg-slate-900 rounded-2xl border transition-all active:scale-[0.98] p-4 ${
              isWon  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/10'
            : isLost ? 'border-slate-100 dark:border-slate-800 opacity-70'
                     : 'border-slate-100 dark:border-slate-800 hover:border-primary/20'
            }`}
          >
            <div className="flex justify-between items-start mb-2.5">
              <div>
                <p className="text-xs text-slate-400">{new Date(bet.placedAt).toLocaleDateString('en-GH', { day: '2-digit', month: 'short' })}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{bet.selections.length} selection{bet.selections.length !== 1 ? 's' : ''}</p>
              </div>
              <StatusBadge status={bet.status} />
            </div>

            <div className="space-y-1 mb-3">
              {bet.selections.slice(0, 2).map((sel: BetSelection, i: number) => (
                <p key={sel.id ?? i} className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {sel.homeTeam && sel.awayTeam
                    ? `${sel.homeTeam} vs ${sel.awayTeam}`
                    : sel.matchId
                  } · <span className="font-medium">{sel.selection}</span>
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
                <p className={`text-sm font-bold ${isWon ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {formatCurrency(bet.potentialReturn)}
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

      {/* Unseen win popup */}
      {winPopup && (
        <WinModal
          bet={winPopup}
          onClose={() => dismissWin(winPopup)}
        />
      )}
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

      {/* Header */}
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

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        {activeTab === 'slip' ? <SlipTab /> : <MyBetsTab />}
      </div>
    </div>
  );
}