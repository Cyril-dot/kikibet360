import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import {
  adminAnalytics,
  adminMatches,
  adminPredictions,
  adminAffiliate,
  withdrawals,
  booking,
  superAdminUpgradeChats,
  upgradeChats,
  superAdmin,
  superAdminPayouts,
} from '../utils/api';
import type {
  AdminUpgradeChatDto,
  AdminUpgradeChatMessageDto,
  Match,
  AiPrediction,
  BookingCode,
  WithdrawalRequest,
  PayoutRequest,
  AffiliateStatsDTO,
  AuditLog,
} from '../utils/api';

import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PaymentsIcon from '@mui/icons-material/Payments';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ChatIcon from '@mui/icons-material/Chat';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import PsychologyIcon from '@mui/icons-material/Psychology';
import QrCodeIcon from '@mui/icons-material/QrCode';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import CircularProgress from '@mui/icons-material/Loop';
import AddIcon from '@mui/icons-material/Add';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionKey =
  | 'dashboard'
  | 'matches'
  | 'predictions'
  | 'bookings'
  | 'affiliate'
  | 'withdrawals'
  | 'upgrade-chats'
  | 'payouts'
  | 'audit';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, currency = 'GHS') {
  return `${currency} ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-900/30 text-amber-400',
    PENDING_COMMISSION: 'bg-amber-900/30 text-amber-400',
    APPROVED: 'bg-emerald-900/30 text-emerald-400',
    COMMISSION_SET: 'bg-emerald-900/30 text-emerald-400',
    REJECTED: 'bg-red-900/30 text-red-400',
    CLOSED: 'bg-slate-700 text-slate-400',
    SETTLED: 'bg-blue-900/30 text-blue-400',
    PAID: 'bg-emerald-900/30 text-emerald-400',
    REQUESTED: 'bg-amber-900/30 text-amber-400',
    SCHEDULED: 'bg-blue-900/30 text-blue-400',
    LIVE: 'bg-green-900/30 text-green-400',
    FINISHED: 'bg-slate-700 text-slate-400',
    active: 'bg-emerald-900/30 text-emerald-400',
    suspended: 'bg-red-900/30 text-red-400',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${map[status] ?? 'bg-slate-700 text-slate-300'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function Spinner() {
  return <CircularProgress fontSize="small" className="animate-spin text-primary" />;
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-slate-600 mb-3">{icon}</span>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

// ─── Chat panel ──────────────────────────────────────────────────────────────

function UpgradeChatPanel({
  chat,
  isSuperAdmin,
  onClose,
  onCommissionSet,
}: {
  chat: AdminUpgradeChatDto;
  isSuperAdmin: boolean;
  onClose: () => void;
  onCommissionSet: () => void;
}) {
  const { showToast } = useAppStore();
  const [messages, setMessages] = useState<AdminUpgradeChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [commissionInput, setCommissionInput] = useState('');
  const [settingCommission, setSettingCommission] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const fn = isSuperAdmin
        ? () => superAdminUpgradeChats.getMessages(chat.id)
        : () => upgradeChats.getMessages(chat.id);
      const res = await fn();
      if (res.success) setMessages(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [chat.id, isSuperAdmin]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const content = msgInput.trim();
    if (!content) return;
    setSending(true);
    try {
      const fn = isSuperAdmin
        ? () => superAdminUpgradeChats.sendMessage(chat.id, { content })
        : () => upgradeChats.sendMessage(chat.id, { content });
      const res = await fn();
      if (res.success) {
        setMessages((prev) => [...prev, res.data]);
        setMsgInput('');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to send.', 'error');
    } finally { setSending(false); }
  };

  const handleSetCommission = async () => {
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 0.1 || rate > 100) {
      showToast('Rate must be between 0.1 and 100.', 'error');
      return;
    }
    setSettingCommission(true);
    try {
      const res = await superAdminUpgradeChats.setCommission(chat.id, { commissionRate: rate });
      if (res.success) {
        showToast('Commission set successfully!', 'success');
        setCommissionInput('');
        onCommissionSet();
        fetchMessages();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to set commission.', 'error');
    } finally { setSettingCommission(false); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-800 shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors">
          <CloseIcon fontSize="small" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {chat.userFirstName ?? 'User'} · {chat.userEmail ?? ''}
          </p>
          <StatusBadge status={chat.status} />
        </div>
        {chat.commissionRate != null && (
          <span className="text-xs text-emerald-400 font-bold shrink-0">{chat.commissionRate}% commission</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : messages.length === 0 ? (
          <EmptyState icon={<ChatIcon sx={{ fontSize: 40 }} />} text="No messages yet." />
        ) : (
          messages.map((msg) => {
            if (msg.senderRole === 'SYSTEM') {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="bg-slate-700/60 border border-slate-600 rounded-xl px-4 py-2 max-w-[80%]">
                    <p className="text-xs text-slate-300 text-center">{msg.content}</p>
                    <p className="text-[10px] text-slate-500 text-center mt-1">{fmtDate(msg.sentAt)}</p>
                  </div>
                </div>
              );
            }
            const isCurrentSide = isSuperAdmin
              ? msg.senderRole === 'SUPER_ADMIN'
              : msg.senderRole === 'USER';
            return (
              <div key={msg.id} className={`flex ${isCurrentSide ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isCurrentSide
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                }`}>
                  {!isCurrentSide && (
                    <p className="text-[10px] font-bold mb-1 text-slate-400 uppercase tracking-wider">
                      {msg.senderRole === 'SUPER_ADMIN' ? 'Support' : msg.senderName}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isCurrentSide ? 'text-white/60' : 'text-slate-500'}`}>
                    {fmtDate(msg.sentAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Set commission (super admin only, pending chats) */}
      {isSuperAdmin && chat.status === 'PENDING_COMMISSION' && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/60 shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Set Commission Rate</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              value={commissionInput}
              onChange={(e) => setCommissionInput(e.target.value)}
              placeholder="e.g. 60"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              onClick={handleSetCommission}
              disabled={settingCommission || !commissionInput}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"
            >
              {settingCommission ? <Spinner /> : <><CheckIcon fontSize="small" /> Set</>}
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      {chat.status !== 'CLOSED' && (
        <div className="px-4 py-3 border-t border-slate-700 shrink-0 flex gap-2">
          <input
            type="text"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message…"
            maxLength={2000}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !msgInput.trim()}
            className="p-2.5 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            {sending ? <Spinner /> : <SendIcon fontSize="small" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section: Dashboard ───────────────────────────────────────────────────────

function DashboardSection({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStatsDTO | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, affRes] = await Promise.all([
        adminAnalytics.get(range),
        adminAffiliate.getStats(),
      ]);
      if (analyticsRes.success) setAnalytics(analyticsRes.data as Record<string, unknown>);
      if (affRes.success) setAffiliateStats(affRes.data);

      if (isSuperAdmin) {
        const metricsRes = await superAdmin.metrics();
        if (metricsRes.success) setMetrics(metricsRes.data as Record<string, unknown>);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [range, isSuperAdmin]);

  useEffect(() => { fetch(); }, [fetch]);

  const kpis = isSuperAdmin && metrics
    ? [
        { label: 'Total Users',   value: String(metrics.totalUsers   ?? '—') },
        { label: 'Total Admins',  value: String(metrics.totalAdmins  ?? '—') },
        { label: 'Total Revenue', value: typeof metrics.totalRevenue === 'number' ? fmt(metrics.totalRevenue) : '—' },
        { label: 'Active Chats',  value: String(metrics.activeChats  ?? '—') },
      ]
    : analytics
    ? [
        { label: 'Total Revenue',    value: typeof analytics.totalRevenue === 'number'    ? fmt(analytics.totalRevenue)    : '—' },
        { label: 'Total Bets',       value: String(analytics.totalBets       ?? '—') },
        { label: 'Total Users',      value: String(analytics.totalUsers      ?? '—') },
        { label: 'Aff. Balance',     value: affiliateStats ? fmt(affiliateStats.availableBalance) : '—' },
      ]
    : [
        { label: 'Total Revenue', value: '—' },
        { label: 'Total Bets',    value: '—' },
        { label: 'Total Users',   value: '—' },
        { label: 'Aff. Balance',  value: '—' },
      ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-white">Dashboard</h2>
        <div className="flex gap-1.5">
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === r ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              {r}
            </button>
          ))}
          <button onClick={fetch} className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors">
            <RefreshIcon fontSize="small" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1.5">{kpi.label}</p>
            {loading
              ? <div className="h-7 bg-slate-700 rounded animate-pulse" />
              : <p className="font-heading text-xl font-bold text-white">{kpi.value}</p>
            }
          </div>
        ))}
      </div>

      {/* Affiliate summary */}
      {affiliateStats && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Affiliate Summary</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Referrals',   value: String(affiliateStats.totalReferrals) },
              { label: 'Lifetime Stake',    value: fmt(affiliateStats.lifetimeStake)     },
              { label: 'Lifetime Comms.',   value: fmt(affiliateStats.lifetimeCommission) },
              { label: 'Available Balance', value: fmt(affiliateStats.availableBalance)  },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue bar chart (sparkline) */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Revenue Trend</p>
        {loading
          ? <div className="h-28 bg-slate-700 rounded animate-pulse" />
          : (
            <div className="flex items-end gap-1 h-28">
              {(analytics?.dailyRevenue as number[] | undefined ?? [35, 55, 42, 68, 75, 60, 85, 90, 72, 95, 80, 88]).map((h, i) => {
                const max = Math.max(...(analytics?.dailyRevenue as number[] | undefined ?? [100]));
                const pct = typeof h === 'number' ? (h / max) * 100 : h;
                return (
                  <div key={i} className="flex-1 bg-primary/70 rounded-t hover:bg-primary transition-colors" style={{ height: `${pct}%` }} />
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ─── Section: Matches ─────────────────────────────────────────────────────────

function MatchesSection() {
  const { showToast } = useAppStore();
  const [list, setList] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ homeTeam: '', awayTeam: '', league: '', sport: 'football', kickoffAt: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    adminMatches.list().then((r) => { if (r.success) setList(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!form.homeTeam || !form.awayTeam) { showToast('Home and away teams required.', 'error'); return; }
    setCreating(true);
    try {
      const res = await adminMatches.create({ ...form });
      if (res.success) { setList((p) => [res.data, ...p]); setShowCreate(false); setForm({ homeTeam: '', awayTeam: '', league: '', sport: 'football', kickoffAt: '' }); showToast('Match created!', 'success'); }
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
    finally { setCreating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await adminMatches.updateStatus(id, { status });
      if (res.success) setList((p) => p.map((m) => m.id === id ? res.data : m));
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-white">Matches</h2>
        <button onClick={() => setShowCreate((p) => !p)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/80 transition-colors">
          <AddIcon fontSize="small" /> New Match
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
          <p className="text-sm font-bold text-white">Create Match</p>
          <div className="grid grid-cols-2 gap-3">
            {[['homeTeam', 'Home Team'], ['awayTeam', 'Away Team'], ['league', 'League'], ['sport', 'Sport']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input type="text" value={(form as Record<string, string>)[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Kickoff At</label>
            <input type="datetime-local" value={form.kickoffAt} onChange={(e) => setForm((p) => ({ ...p, kickoffAt: e.target.value }))} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-600">Cancel</button>
            <button onClick={create} disabled={creating} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-1.5">
              {creating ? <Spinner /> : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading
        ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
        : list.length === 0
        ? <EmptyState icon={<SportsSoccerIcon sx={{ fontSize: 40 }} />} text="No matches yet." />
        : (
          <div className="space-y-2">
            {list.map((m) => (
              <div key={m.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{m.homeTeam} vs {m.awayTeam}</p>
                  <p className="text-xs text-slate-400">{m.league ?? '—'} · {m.kickoffAt ? fmtDate(m.kickoffAt) : '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={m.status ?? 'SCHEDULED'} />
                  <select
                    value={m.status ?? 'SCHEDULED'}
                    onChange={(e) => updateStatus(m.id, e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none"
                  >
                    {['SCHEDULED','LIVE','FINISHED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Section: Predictions ────────────────────────────────────────────────────

function PredictionsSection() {
  const { showToast } = useAppStore();
  const [list, setList] = useState<AiPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchId, setMatchId] = useState('');
  const [running, setRunning] = useState<string | null>(null);

  const fetch = () => {
    adminPredictions.list().then((r) => { if (r.success) setList(r.data.content); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const run = async () => {
    if (!matchId.trim()) return;
    setRunning('new');
    try {
      const res = await adminPredictions.run({ matchId });
      if (res.success) { setList((p) => [res.data, ...p]); setMatchId(''); showToast('Prediction generated!', 'success'); }
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
    finally { setRunning(null); }
  };

  const toggle = async (p: AiPrediction) => {
    setRunning(p.id);
    try {
      const res = p.publishedToUsers ? await adminPredictions.unpublish(p.id) : await adminPredictions.share(p.id);
      if (res.success) setList((prev) => prev.map((x) => x.id === p.id ? res.data : x));
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
    finally { setRunning(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-white">AI Predictions</h2>
        <button onClick={fetch} className="p-1.5 rounded-xl bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"><RefreshIcon fontSize="small" /></button>
      </div>

      <div className="flex gap-2">
        <input type="text" value={matchId} onChange={(e) => setMatchId(e.target.value)} placeholder="Match UUID" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={run} disabled={running === 'new' || !matchId.trim()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-1.5 hover:bg-primary/80 transition-colors">
          {running === 'new' ? <Spinner /> : <><PsychologyIcon fontSize="small" /> Run</>}
        </button>
      </div>

      {loading
        ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
        : list.length === 0
        ? <EmptyState icon={<PsychologyIcon sx={{ fontSize: 40 }} />} text="No predictions yet." />
        : (
          <div className="space-y-2">
            {list.map((p) => (
              <div key={p.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">Match {p.matchId.slice(0, 8)}…</p>
                  <p className="text-xs text-slate-400">{fmtDate(p.generatedAt)} · {p.model ?? 'GPT-4'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${p.publishedToUsers ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                    {p.publishedToUsers ? 'Published' : 'Draft'}
                  </span>
                  <button
                    onClick={() => toggle(p)}
                    disabled={running === p.id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${p.publishedToUsers ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'}`}
                  >
                    {running === p.id ? <Spinner /> : p.publishedToUsers ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Section: Bookings ────────────────────────────────────────────────────────

function BookingsSection() {
  const { showToast } = useAppStore();
  const [list, setList] = useState<BookingCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ label: '', currency: 'GHS', stake: '', maxRedemptions: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    booking.list().then((r) => { if (r.success) setList(r.data.content); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const create = async () => {
    setCreating(true);
    try {
      const res = await booking.create({
        label: form.label || undefined,
        currency: form.currency,
        stake: parseFloat(form.stake) || undefined,
        maxRedemptions: parseInt(form.maxRedemptions) || undefined,
      });
      if (res.success) { setList((p) => [res.data, ...p]); setShowCreate(false); showToast('Booking code created!', 'success'); }
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-white">Booking Codes</h2>
        <button onClick={() => setShowCreate((p) => !p)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/80 transition-colors">
          <AddIcon fontSize="small" /> New Code
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
          <p className="text-sm font-bold text-white">Create Booking Code</p>
          <div className="grid grid-cols-2 gap-3">
            {[['label','Label'],['currency','Currency'],['stake','Stake'],['maxRedemptions','Max Redemptions']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input type={['stake','maxRedemptions'].includes(k) ? 'number' : 'text'} value={(form as Record<string, string>)[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-600">Cancel</button>
            <button onClick={create} disabled={creating} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-1.5">
              {creating ? <Spinner /> : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading
        ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
        : list.length === 0
        ? <EmptyState icon={<QrCodeIcon sx={{ fontSize: 40 }} />} text="No booking codes yet." />
        : (
          <div className="space-y-2">
            {list.map((bc) => (
              <div key={bc.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white font-mono">{bc.code}</p>
                  <p className="text-xs text-slate-400">{bc.label ?? '—'} · {bc.redemptionCount ?? 0}/{bc.maxRedemptions ?? '∞'} redeemed · {bc.stake ? fmt(bc.stake) : '—'}</p>
                </div>
                <StatusBadge status={bc.status ?? 'ACTIVE'} />
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Section: Affiliate ──────────────────────────────────────────────────────

function AffiliateSection() {
  const { showToast } = useAppStore();
  const [stats, setStats] = useState<AffiliateStatsDTO | null>(null);
  const [payoutWindow, setPayoutWindow] = useState<boolean | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, windowRes, historyRes] = await Promise.all([
        adminAffiliate.getStats(),
        adminAffiliate.getPayoutWindow(),
        adminAffiliate.getPayoutHistory(),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (windowRes.success) setPayoutWindow(!!(windowRes.data as { open?: boolean }).open);
      if (historyRes.success) setPayoutHistory(historyRes.data.content);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const requestPayout = async () => {
    setRequesting(true);
    try {
      const res = await adminAffiliate.requestPayout();
      if (res.success) { showToast('Payout requested!', 'success'); fetch(); }
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
    finally { setRequesting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-white">Affiliate</h2>
        <button onClick={fetch} className="p-1.5 rounded-xl bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"><RefreshIcon fontSize="small" /></button>
      </div>

      {loading
        ? <div className="h-32 bg-slate-800 rounded-2xl animate-pulse" />
        : stats && (
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Referrals',    value: String(stats.totalReferrals)        },
                { label: 'Lifetime Stake',     value: fmt(stats.lifetimeStake)            },
                { label: 'Lifetime Commiss.',  value: fmt(stats.lifetimeCommission)       },
                { label: 'Available Balance',  value: fmt(stats.availableBalance)         },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-base font-bold text-white mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Payout Window</p>
                <p className="text-xs text-slate-400">Available Fridays only</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${payoutWindow ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {payoutWindow ? 'OPEN' : 'CLOSED'}
                </span>
                {payoutWindow && (
                  <button onClick={requestPayout} disabled={requesting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {requesting ? <Spinner /> : <><AttachMoneyIcon fontSize="small" /> Request</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {payoutHistory.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payout History</p>
          {payoutHistory.map((pr) => (
            <div key={pr.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{fmt(pr.amount)}</p>
                <p className="text-xs text-slate-400">{fmtDate(pr.createdAt)}</p>
              </div>
              <StatusBadge status={pr.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: Withdrawals ────────────────────────────────────────────────────

function WithdrawalsSection() {
  const { showToast } = useAppStore();
  const [list, setList] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | undefined>('PENDING');

  const fetch = useCallback(() => {
    setLoading(true);
    withdrawals.getAllForAdmin(0, 20, statusFilter).then((r) => { if (r.success) setList(r.data.content); }).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const approve = async (id: string) => {
    setProcessing(id);
    try {
      const res = await withdrawals.approve(id, { note: 'Approved via admin panel' });
      if (res.success) { setList((p) => p.map((w) => w.id === id ? res.data : w)); showToast('Approved!', 'success'); }
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
    finally { setProcessing(null); }
  };

  const reject = async (id: string) => {
    setProcessing(id);
    try {
      const res = await withdrawals.reject(id, { note: 'Rejected via admin panel' });
      if (res.success) { setList((p) => p.map((w) => w.id === id ? res.data : w)); showToast('Rejected.', 'success'); }
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
    finally { setProcessing(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-white">Withdrawals</h2>
        <button onClick={fetch} className="p-1.5 rounded-xl bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"><RefreshIcon fontSize="small" /></button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {([undefined, 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <button key={String(s)} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
            {s ?? 'All'}
          </button>
        ))}
      </div>

      {loading
        ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
        : list.length === 0
        ? <EmptyState icon={<PaymentsIcon sx={{ fontSize: 40 }} />} text="No withdrawals found." />
        : (
          <div className="space-y-2">
            {list.map((w) => (
              <div key={w.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{w.user?.firstName ?? ''} {w.user?.lastName ?? ''} · {fmt(w.amount)}</p>
                  <p className="text-xs text-slate-400">{w.method} · {w.accountName} · {w.accountNumber}</p>
                  <p className="text-xs text-slate-500">{fmtDate(w.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={w.status} />
                  {w.status === 'PENDING' && (
                    <>
                      <button disabled={processing === w.id} onClick={() => approve(w.id)} className="p-1.5 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors disabled:opacity-50">
                        {processing === w.id ? <Spinner /> : <CheckIcon fontSize="small" />}
                      </button>
                      <button disabled={processing === w.id} onClick={() => reject(w.id)} className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50">
                        <BlockIcon fontSize="small" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Section: Upgrade Chats ──────────────────────────────────────────────────

function UpgradeChatsSection({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [chats, setChats] = useState<AdminUpgradeChatDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<AdminUpgradeChatDto | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  const fetch = useCallback(() => {
    setLoading(true);
    const fn = filter === 'pending'
      ? superAdminUpgradeChats.getPending
      : superAdminUpgradeChats.getAll;
    fn().then((r) => { if (r.success) setChats(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  if (activeChat) {
    return (
      <div className="h-full -m-3 sm:-m-5 md:-m-6 flex flex-col">
        <UpgradeChatPanel
          chat={activeChat}
          isSuperAdmin={isSuperAdmin}
          onClose={() => { setActiveChat(null); fetch(); }}
          onCommissionSet={() => { fetch(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-xl font-bold text-white">Upgrade Chats</h2>
          {chats.length > 0 && (
            <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{chats.length}</span>
          )}
        </div>
        <button onClick={fetch} className="p-1.5 rounded-xl bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"><RefreshIcon fontSize="small" /></button>
      </div>

      <div className="flex gap-2">
        {(['pending', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
            {f === 'pending' ? 'Pending' : 'All'}
          </button>
        ))}
      </div>

      {loading
        ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
        : chats.length === 0
        ? <EmptyState icon={<MarkChatReadIcon sx={{ fontSize: 40 }} />} text={filter === 'pending' ? 'No pending chats.' : 'No upgrade chats.'} />
        : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className="w-full bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-primary/40 transition-colors text-left flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-white truncate">{chat.userFirstName ?? 'User'}</p>
                    <StatusBadge status={chat.status} />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{chat.userEmail ?? '—'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {chat.messageCount ?? 0} messages · {fmtDate(chat.createdAt)}
                    {chat.commissionRate != null && ` · ${chat.commissionRate}% commission`}
                  </p>
                </div>
                <ChatIcon fontSize="small" className="text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Section: Payouts (Super Admin) ──────────────────────────────────────────

function PayoutsSection() {
  const { showToast } = useAppStore();
  const [list, setList] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetch = () => {
    superAdminPayouts.getPending().then((r) => { if (r.success) setList(r.data); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const action = async (id: string, type: 'approve' | 'reject' | 'markPaid') => {
    setProcessing(id);
    try {
      let res;
      if (type === 'approve')  res = await superAdminPayouts.approve(id);
      else if (type === 'reject') res = await superAdminPayouts.reject(id, { reason: 'Rejected via admin panel' });
      else res = await superAdminPayouts.markPaid(id);
      if (res.success) { setList((p) => p.map((r) => r.id === id ? res.data : r)); showToast('Done!', 'success'); }
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Failed.', 'error'); }
    finally { setProcessing(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-white">Payout Requests</h2>
        <button onClick={fetch} className="p-1.5 rounded-xl bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"><RefreshIcon fontSize="small" /></button>
      </div>

      {loading
        ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
        : list.length === 0
        ? <EmptyState icon={<AttachMoneyIcon sx={{ fontSize: 40 }} />} text="No payout requests." />
        : (
          <div className="space-y-2">
            {list.map((pr) => (
              <div key={pr.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{fmt(pr.amount)}</p>
                    <p className="text-xs text-slate-400">{fmtDate(pr.createdAt)}</p>
                  </div>
                  <StatusBadge status={pr.status} />
                </div>
                {(pr.status === 'REQUESTED' || pr.status === 'APPROVED') && (
                  <div className="flex gap-2">
                    {pr.status === 'REQUESTED' && (
                      <>
                        <button disabled={processing === pr.id} onClick={() => action(pr.id, 'approve')} className="flex-1 py-1.5 rounded-xl bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                          {processing === pr.id ? <Spinner /> : <><CheckIcon fontSize="small" /> Approve</>}
                        </button>
                        <button disabled={processing === pr.id} onClick={() => action(pr.id, 'reject')} className="flex-1 py-1.5 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-900/50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                          <BlockIcon fontSize="small" /> Reject
                        </button>
                      </>
                    )}
                    {pr.status === 'APPROVED' && (
                      <button disabled={processing === pr.id} onClick={() => action(pr.id, 'markPaid')} className="flex-1 py-1.5 rounded-xl bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        {processing === pr.id ? <Spinner /> : <><AttachMoneyIcon fontSize="small" /> Mark Paid</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Section: Audit Log ───────────────────────────────────────────────────────

function AuditSection({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [list, setList] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fn = isSuperAdmin ? superAdmin.auditLog : adminAnalytics.auditLog;
    fn().then((r) => { if (r.success) setList(r.data.content); }).catch(() => {}).finally(() => setLoading(false));
  }, [isSuperAdmin]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-white">Audit Log</h2>
      {loading
        ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
        : list.length === 0
        ? <EmptyState icon={<HistoryIcon sx={{ fontSize: 40 }} />} text="No audit logs." />
        : (
          <div className="space-y-2">
            {list.map((log) => (
              <div key={log.id} className="bg-slate-800 rounded-2xl p-3 border border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary">{log.action}</span>
                  <span className="text-xs text-slate-500">{fmtDate(log.createdAt)}</span>
                </div>
                {log.targetEntity && <p className="text-xs text-slate-400 mt-0.5">{log.targetEntity} · {log.targetId?.slice(0, 8)}…</p>}
                {log.ipAddress && <p className="text-xs text-slate-600">{log.ipAddress}</p>}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Main AdminModal ──────────────────────────────────────────────────────────

export default function AdminModal() {
  const { isAdminModalOpen, setAdminModalOpen, user } = useAppStore();
  const [activeSection, setActiveSection] = useState<SectionKey>('dashboard');

  if (!isAdminModalOpen || !user) return null;

  // Cast to string to support runtime values ('SUPER_ADMIN', 'super_admin')
  // that may not be reflected in the static User type yet.
  const role = user.role as string;
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'super_admin';

  const sections: { key: SectionKey; label: string; icon: React.ReactNode; superAdminOnly?: boolean }[] = [
    { key: 'dashboard',     label: 'Dashboard',     icon: <BarChartIcon fontSize="small" />           },
    { key: 'matches',       label: 'Matches',        icon: <SportsSoccerIcon fontSize="small" />       },
    { key: 'predictions',   label: 'Predictions',    icon: <PsychologyIcon fontSize="small" />         },
    { key: 'bookings',      label: 'Codes',          icon: <QrCodeIcon fontSize="small" />             },
    { key: 'affiliate',     label: 'Affiliate',      icon: <GroupAddIcon fontSize="small" />           },
    { key: 'withdrawals',   label: 'Withdrawals',    icon: <PaymentsIcon fontSize="small" />           },
    { key: 'upgrade-chats', label: 'Upgrade Chats',  icon: <ChatIcon fontSize="small" />, superAdminOnly: true },
    { key: 'payouts',       label: 'Payouts',        icon: <AttachMoneyIcon fontSize="small" />, superAdminOnly: true },
    { key: 'audit',         label: 'Audit',          icon: <HistoryIcon fontSize="small" />            },
  ];

  const visibleSections = sections.filter((s) => !s.superAdminOnly || isSuperAdmin);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/98 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0 bg-slate-900">
        <div className="flex items-center gap-2">
          {isSuperAdmin
            ? <SupervisorAccountIcon className="text-purple-400" fontSize="small" />
            : <AdminPanelSettingsIcon className="text-primary" fontSize="small" />
          }
          <h1 className="font-heading text-base sm:text-lg font-bold text-white">
            {isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
          </h1>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isSuperAdmin ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
            {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
          </span>
        </div>
        <button onClick={() => setAdminModalOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-800">
          <CloseIcon fontSize="small" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex w-52 flex-col border-r border-slate-700 bg-slate-800/50 p-3 gap-1 shrink-0 overflow-y-auto">
          {visibleSections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeSection === section.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="md:hidden absolute top-[52px] left-0 right-0 flex overflow-x-auto gap-1.5 px-3 py-2 border-b border-slate-700 bg-slate-900 scrollbar-hide z-10 shrink-0">
          {visibleSections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[36px] ${
                activeSection === section.key
                  ? 'bg-primary text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 mt-[52px] md:mt-0">
          {activeSection === 'dashboard'     && <DashboardSection isSuperAdmin={isSuperAdmin} />}
          {activeSection === 'matches'       && <MatchesSection />}
          {activeSection === 'predictions'   && <PredictionsSection />}
          {activeSection === 'bookings'      && <BookingsSection />}
          {activeSection === 'affiliate'     && <AffiliateSection />}
          {activeSection === 'withdrawals'   && <WithdrawalsSection />}
          {activeSection === 'upgrade-chats' && isSuperAdmin && <UpgradeChatsSection isSuperAdmin={isSuperAdmin} />}
          {activeSection === 'payouts'       && isSuperAdmin && <PayoutsSection />}
          {activeSection === 'audit'         && <AuditSection isSuperAdmin={isSuperAdmin} />}
        </div>
      </div>
    </div>
  );
}