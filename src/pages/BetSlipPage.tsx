import { useState } from 'react';
import { useAppStore } from '../store';
import { formatCurrency, calculateTotalOdds, calculatePotentialReturn } from '../utils';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import CloseIcon from '@mui/icons-material/Close';

export default function BetSlipPage() {
  const { betSlip, removeFromBetSlip, clearBetSlip, placeBet, mainWalletBalance, bets } = useAppStore();
  const [activeTab, setActiveTab] = useState<'slip' | 'bets'>('slip');
  const [stake, setStake] = useState('');
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [winModal, setWinModal] = useState<string | null>(null);
  const [lossModal, setLossModal] = useState<string | null>(null);
  const quickStakes = [10, 20, 50, 100];

  const totalOdds = calculateTotalOdds(betSlip.map((s) => s.odd));
  const potentialReturn = calculatePotentialReturn(parseFloat(stake) || 0, totalOdds);

  const handlePlaceBet = () => {
    placeBet(parseFloat(stake));
    setStake('');
  };

  const betDetail = detailModal ? bets.find((b) => b.id === detailModal) : null;

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
        <button
          onClick={() => setActiveTab('slip')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'slip' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'
          }`}
        >
          <ReceiptLongIcon fontSize="small" />
          Bet Slip ({betSlip.length})
        </button>
        <button
          onClick={() => setActiveTab('bets')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'bets' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'
          }`}
        >
          <HistoryIcon fontSize="small" />
          My Bets
        </button>
      </div>

      {activeTab === 'slip' && (
        <div>
          {betSlip.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ReceiptLongIcon className="mx-auto mb-2" fontSize="large" />
              <p>No selections yet</p>
              <p className="text-sm mt-1">Click odds to add selections</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {betSlip.map((sel) => (
                  <div
                    key={`${sel.matchId}-${sel.market}-${sel.selection}`}
                    className="flex items-start justify-between p-3 card"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sel.matchName}</p>
                      <p className="text-sm font-medium">{sel.market}: {sel.selection}</p>
                      <p className="text-sm font-bold text-primary">{sel.odd.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeFromBetSlip(sel.matchId, sel.market, sel.selection)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="card p-4">
                <div className="flex gap-1.5 mb-3">
                  {quickStakes.map((qs) => (
                    <button
                      key={qs}
                      onClick={() => setStake((prev) => (parseFloat(prev || '0') + qs).toString())}
                      className="flex-1 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      +{qs}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="Stake (GH\u20B5)"
                  className="input-field mb-3"
                  min="0"
                  step="0.01"
                />
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Total Odds</span>
                  <span className="font-bold">{totalOdds.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-slate-500">Potential Return</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(potentialReturn)}</span>
                </div>
                <button
                  onClick={handlePlaceBet}
                  disabled={!stake || parseFloat(stake) <= 0 || parseFloat(stake) > mainWalletBalance}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Place Bet
                </button>
                <button onClick={clearBetSlip} className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-red-500 transition-colors">
                  Clear All
                </button>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Booking Code</label>
                <input type="text" placeholder="Enter booking code" className="input-field" />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'bets' && (
        <div className="space-y-3">
          {bets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <HistoryIcon className="mx-auto mb-2" fontSize="large" />
              <p>No bets yet</p>
            </div>
          ) : (
            bets.map((bet) => (
              <div
                key={bet.id}
                onClick={() => setDetailModal(bet.id)}
                className={`card p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  bet.status === 'won' ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' :
                  bet.status === 'lost' ? 'opacity-70' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500">{bet.selections.length} selections</span>
                  <span className={`badge ${
                    bet.status === 'won' ? 'badge-green' : bet.status === 'lost' ? 'badge-gray' : 'badge-amber'
                  }`}>
                    {bet.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 mb-2">
                  {bet.selections.slice(0, 2).map((sel, i) => (
                    <p key={i} className="text-xs text-slate-600 dark:text-slate-400 truncate">{sel.matchName} - {sel.selection}</p>
                  ))}
                  {bet.selections.length > 2 && (
                    <p className="text-xs text-slate-400">+{bet.selections.length - 2} more</p>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Stake: {formatCurrency(bet.stake)}</span>
                  <span className="font-semibold">{formatCurrency(bet.potentialReturn)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {detailModal && betDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setDetailModal(null)}>
          <div className="card p-6 m-4 max-w-md w-full animate-slide-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-lg font-bold">Bet Details</h3>
              <button onClick={() => setDetailModal(null)}><CloseIcon /></button>
            </div>
            <div className="space-y-2 mb-4">
              {betDetail.selections.map((sel, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">{sel.matchName}</p>
                    <p className="text-sm font-medium">{sel.market}: {sel.selection}</p>
                  </div>
                  <span className="font-bold text-primary">{sel.odd.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Stake</span><span className="font-semibold">{formatCurrency(betDetail.stake)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total Odds</span><span className="font-semibold">{betDetail.totalOdds.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Potential Return</span><span className="font-semibold text-green-600">{formatCurrency(betDetail.potentialReturn)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Status</span>
                <span className={`badge ${betDetail.status === 'won' ? 'badge-green' : betDetail.status === 'lost' ? 'badge-gray' : 'badge-amber'}`}>
                  {betDetail.status.toUpperCase()}
                </span>
              </div>
            </div>
            {betDetail.status === 'won' && (
              <button onClick={() => { setDetailModal(null); setWinModal(betDetail.id); }} className="btn-primary w-full mt-4">View Winnings</button>
            )}
            {betDetail.status === 'lost' && (
              <button onClick={() => { setDetailModal(null); setLossModal(betDetail.id); }} className="btn-secondary w-full mt-4">View Details</button>
            )}
          </div>
        </div>
      )}

      {winModal && (() => {
        const bet = bets.find((b) => b.id === winModal);
        if (!bet) return null;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#E6192E', '#FFD700', '#22C55E', '#3B82F6', '#F59E0B'][i % 5],
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
            <div className="card p-8 m-4 max-w-sm w-full text-center animate-slide-up relative z-10">
              <EmojiEventsIcon className="text-yellow-500 mx-auto mb-4" sx={{ fontSize: 64 }} />
              <h2 className="font-heading text-3xl font-bold text-green-600 mb-2">You Won!</h2>
              <p className="text-4xl font-bold text-green-600 mb-4">{formatCurrency(bet.potentialReturn)}</p>
              <div className="space-y-1 text-sm text-slate-500 mb-6">
                <p>Stake: {formatCurrency(bet.stake)}</p>
                <p>Total Odds: {bet.totalOdds.toFixed(2)}</p>
              </div>
              <button onClick={() => setWinModal(null)} className="btn-primary w-full mb-2">Withdraw Winnings</button>
              <button onClick={() => setWinModal(null)} className="btn-secondary w-full">Continue Betting</button>
            </div>
          </div>
        );
      })()}

      {lossModal && (() => {
        const bet = bets.find((b) => b.id === lossModal);
        if (!bet) return null;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="card p-8 m-4 max-w-sm w-full text-center animate-slide-up">
              <SentimentDissatisfiedIcon className="text-slate-400 mx-auto mb-4" sx={{ fontSize: 48 }} />
              <h2 className="font-heading text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Better luck next time</h2>
              <p className="text-2xl font-bold text-slate-400 mb-4">{formatCurrency(bet.stake)}</p>
              <div className="space-y-1 text-sm text-slate-500 mb-6">
                <p>Total Odds: {bet.totalOdds.toFixed(2)}</p>
              </div>
              <button onClick={() => setLossModal(null)} className="btn-primary w-full">Try Again</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
