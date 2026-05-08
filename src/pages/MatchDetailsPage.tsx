import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store';
import { publicMatches } from '../utils/api';
import type { Match } from '../utils/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SportsIcon from '@mui/icons-material/Sports';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StatEntry { home: number; away: number; label: string; }

interface H2HGame {
  date: string; homeTeam: string; awayTeam: string; homeScore: number; awayScore: number;
}

interface LineupsData { home: string[]; away: string[]; }

interface OddsOption { label: string; odd: number; }

interface OddsGroup { market: string; options: OddsOption[]; }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LIVE_STATUSES = new Set([
  'LIVE','live','IN_PLAY','in_play','inplay','FIRST_HALF','first_half','1H','1h',
  'SECOND_HALF','second_half','2H','2h','HALFTIME','halftime','HALF_TIME','half_time','HT','ht',
  'EXTRA_TIME','extra_time','ET','et','PENALTIES','penalties','PEN','pen',
]);
const FINISHED_STATUSES = new Set([
  'FINISHED','finished','FULL_TIME','full_time','FT','ft','AWARDED','awarded',
  'CANCELLED','cancelled','POSTPONED','postponed','ABANDONED','abandoned',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatKickoff(kickoffAt?: string) {
  if (!kickoffAt) return '--:--';
  return new Date(kickoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(kickoffAt?: string) {
  if (!kickoffAt) return '';
  return new Date(kickoffAt).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function finishedLabel(status?: string) {
  const s = status ?? '';
  if (['FINISHED','finished','FULL_TIME','full_time','FT','ft','AWARDED','awarded'].includes(s)) return 'FT';
  if (['POSTPONED','postponed'].includes(s)) return 'PPD';
  if (['CANCELLED','cancelled'].includes(s)) return 'CANC';
  if (['ABANDONED','abandoned'].includes(s)) return 'ABD';
  return 'FT';
}

// ---------------------------------------------------------------------------
// Parse raw API → OddsGroup[]
// ---------------------------------------------------------------------------
function parseOddsGroups(raw: unknown): OddsGroup[] {
  if (!raw) return [];

  let payload: unknown = raw;
  if (typeof raw === 'object' && raw !== null && 'data' in (raw as Record<string, unknown>)) {
    payload = (raw as Record<string, unknown>).data;
  }

  if (Array.isArray(payload)) {
    const first = payload[0] as Record<string, unknown> | undefined;
    if (first && 'market' in first && 'options' in first) {
      return payload as OddsGroup[];
    }

    const rows = payload as Array<Record<string, unknown>>;
    const hasHandicapField = rows.some((r) => r.handicap != null);

    if (hasHandicapField) {
      const lineMap = new Map<string, Map<string, number[]>>();
      const lineOrder: string[] = [];

      for (const o of rows) {
        const handicap = String(o.handicap ?? '');
        const sel      = String(o.selection ?? o.outcome ?? o.label ?? '');
        const odd      = Number(o.value ?? o.odd ?? o.odds ?? o.price ?? 0);
        if (!sel || !handicap || odd <= 0) continue;
        if (!lineMap.has(handicap)) { lineMap.set(handicap, new Map()); lineOrder.push(handicap); }
        const selMap = lineMap.get(handicap)!;
        if (!selMap.has(sel)) selMap.set(sel, []);
        selMap.get(sel)!.push(odd);
      }

      const used = new Set<string>();
      const groups: OddsGroup[] = [];
      const sorted = [...lineOrder].sort((a, b) => parseFloat(a) - parseFloat(b));

      for (const line of sorted) {
        if (used.has(line)) continue;
        const mirrorVal = parseFloat(line) * -1;
        const mirrorKey = lineOrder.find((l) => Math.abs(parseFloat(l) - mirrorVal) < 0.001);

        const options: OddsOption[] = [];
        const addFromMap = (key: string) => {
          const selMap = lineMap.get(key);
          if (!selMap) return;
          for (const [sel, odds] of selMap.entries()) {
            const avg = odds.reduce((a, b) => a + b, 0) / odds.length;
            options.push({ label: `${sel} (${key})`, odd: Math.round(avg * 100) / 100 });
          }
        };

        addFromMap(line);
        if (mirrorKey && mirrorKey !== line) { addFromMap(mirrorKey); used.add(mirrorKey); }
        used.add(line);

        options.sort((a, b) => {
          const isPush = (l: string) => l.toLowerCase().includes('push') || l.toLowerCase().includes('refund');
          if (isPush(a.label) && !isPush(b.label)) return 1;
          if (!isPush(a.label) && isPush(b.label)) return -1;
          return 0;
        });

        if (options.length > 0) {
          const groupLabel = mirrorKey && mirrorKey !== line ? `${line} / ${mirrorKey}` : line;
          groups.push({ market: groupLabel, options });
        }
      }

      return groups;
    }

    const marketMap = new Map<string, Map<string, number[]>>();
    for (const o of rows) {
      const market = String(o.market ?? o.name ?? o.type ?? 'Other');
      const sel    = String(o.selection ?? o.outcome ?? o.label ?? o.name ?? '');
      const odd    = Number(o.value ?? o.odd ?? o.odds ?? o.price ?? 0);
      if (!sel || odd <= 0) continue;
      if (!marketMap.has(market)) marketMap.set(market, new Map());
      const selMap = marketMap.get(market)!;
      if (!selMap.has(sel)) selMap.set(sel, []);
      selMap.get(sel)!.push(odd);
    }

    const groups: OddsGroup[] = [];
    for (const [market, selMap] of marketMap.entries()) {
      const options: OddsOption[] = [];
      for (const [sel, odds] of selMap.entries()) {
        const avg = odds.reduce((a, b) => a + b, 0) / odds.length;
        options.push({ label: sel, odd: Math.round(avg * 100) / 100 });
      }
      groups.push({ market, options });
    }

    return groups;
  }

  if (typeof payload === 'object' && payload !== null) {
    const obj = payload as Record<string, unknown>;
    const groups: OddsGroup[] = [];
    for (const [market, entries] of Object.entries(obj)) {
      if (Array.isArray(entries)) {
        const options = (entries as Array<Record<string, unknown>>)
          .map((e) => ({
            label: String(e.selection ?? e.outcome ?? e.name ?? e.label ?? ''),
            odd: Number(e.value ?? e.odd ?? e.odds ?? e.price ?? 0),
          }))
          .filter((o) => o.odd > 0);
        if (options.length > 0) groups.push({ market, options });
      }
    }
    return groups;
  }

  return [];
}

// ---------------------------------------------------------------------------
// Correct Score: deduplicate & sort into home/draw/away buckets
// ---------------------------------------------------------------------------
function parseCorrectScoreGroups(groups: OddsGroup[]) {
  const all = groups.flatMap((g) => g.options);
  const map = new Map<string, number>();
  for (const o of all) {
    const existing = map.get(o.label);
    if (existing === undefined || o.odd < existing) map.set(o.label, o.odd);
  }
  const parseScore = (s: string) => {
    const m = s.match(/(\d+)[:\-](\d+)/);
    return m ? { h: parseInt(m[1]), a: parseInt(m[2]) } : null;
  };
  return [...map.entries()]
    .map(([label, odd]) => ({ label, odd }))
    .sort((a, b) => {
      const am = parseScore(a.label), bm = parseScore(b.label);
      if (!am || !bm) return a.label.localeCompare(b.label);
      const atype = am.h > am.a ? 0 : am.h === am.a ? 1 : 2;
      const btype = bm.h > bm.a ? 0 : bm.h === bm.a ? 1 : 2;
      if (atype !== btype) return atype - btype;
      return (am.h + am.a) - (bm.h + bm.a);
    });
}

function parseStats(raw: unknown): StatEntry[] {
  if (!raw) return [];
  const data = (raw as Record<string, unknown>).data ?? raw;
  if (!data || typeof data !== 'object') return [];
  const LABELS: Record<string, string> = {
    possession:'Possession', ball_possession:'Possession', shots:'Shots', shots_total:'Shots',
    shots_on_target:'Shots on Target', shotsOnTarget:'Shots on Target', corners:'Corners',
    fouls:'Fouls', yellow_cards:'Yellow Cards', yellowCards:'Yellow Cards',
    red_cards:'Red Cards', redCards:'Red Cards', offsides:'Offsides', saves:'Saves',
    passes:'Passes', attacks:'Attacks', dangerous_attacks:'Dangerous Attacks',
  };
  const entries: StatEntry[] = [];
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    const label = LABELS[key]; if (!label) continue;
    if (Array.isArray(val) && val.length >= 2) entries.push({ home: Number(val[0]), away: Number(val[1]), label });
    else if (val && typeof val === 'object') {
      const v = val as Record<string, unknown>;
      entries.push({ home: Number(v.home ?? v.homeTeam ?? 0), away: Number(v.away ?? v.awayTeam ?? 0), label });
    }
  }
  return entries;
}

function parseH2H(raw: unknown): H2HGame[] {
  if (!raw) return [];
  const data = (raw as Record<string, unknown>).data ?? raw;
  const arr = Array.isArray(data) ? data
    : Array.isArray((data as Record<string, unknown>)?.matches)
    ? (data as Record<string, unknown>).matches as unknown[] : [];
  return (arr as Array<Record<string, unknown>>).slice(0, 10)
    .map((g) => ({
      date: String(g.date ?? g.kickoffAt ?? g.kickoff_at ?? ''),
      homeTeam: String(g.homeTeam ?? g.home_team ?? g.home ?? ''),
      awayTeam: String(g.awayTeam ?? g.away_team ?? g.away ?? ''),
      homeScore: Number(g.homeScore ?? g.score_home ?? g.scoreHome ?? 0),
      awayScore: Number(g.awayScore ?? g.score_away ?? g.scoreAway ?? 0),
    }))
    .filter((g) => g.homeTeam && g.awayTeam);
}

function parseLineups(raw: unknown): LineupsData | null {
  if (!raw) return null;
  const data = (raw as Record<string, unknown>).data ?? raw;
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  const extractNames = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((p) => {
      if (typeof p === 'string') return p;
      const pl = p as Record<string, unknown>;
      return String(pl.name ?? pl.player_name ?? pl.playerName ?? pl.fullName ?? '');
    }).filter(Boolean);
  };
  const home = extractNames(obj.home ?? obj.homeTeam ?? obj.home_team ?? []);
  const away = extractNames(obj.away ?? obj.awayTeam ?? obj.away_team ?? []);
  if (!home.length && !away.length) return null;
  return { home, away };
}

// ---------------------------------------------------------------------------
// UI primitives
// ---------------------------------------------------------------------------
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${className ?? ''}`} />;
}

function OddButton({
  label, sublabel, odd, selected, disabled, onClick,
}: {
  label: string; sublabel?: string; odd: number; selected: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || odd <= 0}
      className={`flex flex-col items-center py-2.5 px-2 rounded-xl border-2 transition-all select-none
        ${disabled || odd <= 0
          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          : selected
            ? 'bg-primary text-white border-primary shadow-lg scale-[1.03]'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 cursor-pointer active:scale-95'
        }`}
    >
      {sublabel && (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">{sublabel}</span>
      )}
      <span className={`text-xs font-medium mb-1 text-center leading-tight px-0.5 truncate max-w-full
        ${selected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
        {label}
      </span>
      <span className="text-xl font-black tabular-nums">{odd > 0 ? odd.toFixed(2) : '—'}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Match 1X2 Panel
// ---------------------------------------------------------------------------
function Match1x2Panel({ groups, matchId, matchName, homeTeam, awayTeam }: {
  groups: OddsGroup[]; matchId: string; matchName: string; homeTeam: string; awayTeam: string;
}) {
  const { betSlip, addToBetSlip, showToast } = useAppStore();
  const isSel = (market: string, sel: string) => betSlip.some((s) => s.matchId === matchId && s.market === market && s.selection === sel);
  const pick  = (market: string, sel: string, odd: number) => { addToBetSlip({ matchId, matchName, market, selection: sel, odd }); showToast('Added to bet slip', 'success'); };

  if (!groups.length) return <p className="text-center text-sm text-slate-400 py-8">No odds available yet.</p>;

  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '');
  const main = groups.find((g) => { const m = norm(g.market); return m.includes('1x2') || m.includes('matchresult') || m.includes('matchodds') || m === 'fulltime'; })
    ?? groups.find((g) => g.options.length === 3)
    ?? groups[0];
  const rest = groups.filter((g) => g !== main);

  const findBy = (kw: string) => main.options.find((o) => { const s = norm(o.label); return s === kw || s.includes(kw); });
  let homeOpt = findBy('1') ?? findBy(norm(homeTeam));
  let drawOpt = findBy('draw') ?? findBy('x');
  let awayOpt = findBy('2') ?? findBy(norm(awayTeam));

  if (!homeOpt && !drawOpt && !awayOpt) {
    if (main.options.length >= 3) [homeOpt, drawOpt, awayOpt] = main.options;
    else [homeOpt, awayOpt] = main.options;
  }
  const assigned = new Set([homeOpt, drawOpt, awayOpt]);
  const rem = main.options.filter((o) => !assigned.has(o));
  homeOpt ??= rem.shift() ?? { label: '—', odd: 0 };
  drawOpt ??= rem.shift() ?? { label: '—', odd: 0 };
  awayOpt ??= rem.shift() ?? { label: '—', odd: 0 };

  const trio = [
    { slot: 'Home', team: homeTeam, opt: homeOpt! },
    { slot: 'Draw', team: 'Draw',   opt: drawOpt! },
    { slot: 'Away', team: awayTeam, opt: awayOpt! },
  ];

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Match Result (1X2)</p>
        <div className="grid grid-cols-3 gap-2">
          {trio.map(({ slot, team, opt }) => (
            <OddButton key={slot} sublabel={slot} label={team} odd={opt.odd}
              selected={isSel(main.market, opt.label)}
              onClick={() => opt.odd > 0 && pick(main.market, opt.label, opt.odd)} />
          ))}
        </div>
      </div>

      {rest.map((group, gi) => (
        <div key={gi} className="card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{group.market.replace(/_/g, ' ')}</p>
          <div className={`grid gap-2 ${group.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {group.options.map((opt, oi) => (
              <OddButton key={oi} label={opt.label} odd={opt.odd}
                selected={isSel(group.market, opt.label)}
                onClick={() => pick(group.market, opt.label, opt.odd)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Half Time Panel
// ---------------------------------------------------------------------------
function HalfTimePanel({ groups, matchId, matchName }: {
  groups: OddsGroup[]; matchId: string; matchName: string;
}) {
  const { betSlip, addToBetSlip, showToast } = useAppStore();
  const isSel = (market: string, sel: string) => betSlip.some((s) => s.matchId === matchId && s.market === market && s.selection === sel);
  const pick  = (market: string, sel: string, odd: number) => { addToBetSlip({ matchId, matchName, market, selection: sel, odd }); showToast('Added to bet slip', 'success'); };

  if (!groups.length) return <p className="text-center text-sm text-slate-400 py-8">No half-time odds available.</p>;

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => {
        const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '');
        const drawOpt = group.options.find((o) => norm(o.label) === 'draw' || norm(o.label) === 'x');
        const nonDraw = group.options.filter((o) => o !== drawOpt);
        const homeOpt = nonDraw[0];
        const awayOpt = nonDraw[1];

        const slots = drawOpt
          ? [
              { sublabel: 'Home', opt: homeOpt },
              { sublabel: 'Draw', opt: drawOpt },
              { sublabel: 'Away', opt: awayOpt },
            ].filter((s) => s.opt)
          : group.options.map((opt, i) => ({ sublabel: i === 0 ? 'Home' : 'Away', opt }));

        return (
          <div key={gi} className="card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Half Time Result</p>
            <div className={`grid gap-2 ${slots.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {slots.map(({ sublabel, opt }) => (
                <OddButton
                  key={opt.label}
                  sublabel={sublabel}
                  label={opt.label}
                  odd={opt.odd}
                  selected={isSel(group.market, opt.label)}
                  onClick={() => pick(group.market, opt.label, opt.odd)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Correct Score Panel
// ---------------------------------------------------------------------------
function CorrectScorePanel({ groups, matchId, matchName, homeTeam, awayTeam }: {
  groups: OddsGroup[]; matchId: string; matchName: string; homeTeam: string; awayTeam: string;
}) {
  const { betSlip, addToBetSlip, showToast } = useAppStore();
  const isSel = (market: string, sel: string) => betSlip.some((s) => s.matchId === matchId && s.market === market && s.selection === sel);
  const pick  = (market: string, sel: string, odd: number) => { addToBetSlip({ matchId, matchName, market, selection: sel, odd }); showToast('Added to bet slip', 'success'); };

  const scores = parseCorrectScoreGroups(groups);
  const market = groups[0]?.market ?? 'correct_score';
  if (!scores.length) return <p className="text-center text-sm text-slate-400 py-8">No correct score odds available.</p>;

  const parseScore = (s: string) => { const m = s.match(/(\d+)[:\-](\d+)/); return m ? { h: parseInt(m[1]), a: parseInt(m[2]) } : null; };
  const homeWins: typeof scores = [], draws: typeof scores = [], awayWins: typeof scores = [], other: typeof scores = [];
  for (const s of scores) {
    const p = parseScore(s.label);
    if (!p) { other.push(s); continue; }
    if (p.h > p.a) homeWins.push(s);
    else if (p.h === p.a) draws.push(s);
    else awayWins.push(s);
  }

  const Section = ({ title, bg, items }: { title: string; bg: string; items: typeof scores }) => {
    if (!items.length) return null;
    return (
      <div className="card overflow-hidden">
        <div className={`px-4 py-2.5 ${bg}`}>
          <span className="text-xs font-black uppercase tracking-widest text-white">{title}</span>
        </div>
        <div className="p-3 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {items.map((s) => (
            <button
              key={s.label}
              onClick={() => pick(market, s.label, s.odd)}
              className={`flex flex-col items-center py-2 px-1 rounded-xl border-2 transition-all
                ${isSel(market, s.label)
                  ? 'bg-primary text-white border-primary shadow-md scale-[1.05]'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 active:scale-95'
                }`}
            >
              <span className="text-sm font-black tabular-nums leading-none">{s.label}</span>
              <span className={`text-[11px] font-bold tabular-nums mt-0.5 ${isSel(market, s.label) ? 'text-white/80' : 'text-primary'}`}>
                {s.odd.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Section title={`${homeTeam} Win`} bg="bg-primary"  items={homeWins} />
      <Section title="Draw"              bg="bg-slate-500" items={draws}    />
      <Section title={`${awayTeam} Win`} bg="bg-blue-500" items={awayWins} />
      {other.length > 0 && <Section title="Other" bg="bg-slate-400" items={other} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Handicap Panel
// ---------------------------------------------------------------------------
function HandicapPanel({ groups, matchId, matchName }: {
  groups: OddsGroup[]; matchId: string; matchName: string; homeTeam: string; awayTeam: string;
}) {
  const { betSlip, addToBetSlip, showToast } = useAppStore();
  const isSel = (market: string, sel: string) => betSlip.some((s) => s.matchId === matchId && s.market === market && s.selection === sel);
  const pick  = (market: string, sel: string, odd: number) => { addToBetSlip({ matchId, matchName, market, selection: sel, odd }); showToast('Added to bet slip', 'success'); };

  if (!groups.length) return <p className="text-center text-sm text-slate-400 py-8">No handicap odds available.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Asian Handicap</span>
        <span className="text-[10px] text-slate-400">{groups.length} line(s) — averaged across bookmakers</span>
      </div>

      {groups.map((group, gi) => {
        const isPushLine = group.options.some((o) => o.label.toLowerCase().includes('push') || o.label.toLowerCase().includes('refund'));
        const mainOpts   = group.options.filter((o) => !o.label.toLowerCase().includes('push') && !o.label.toLowerCase().includes('refund'));
        const pushOpt    = group.options.find((o) => o.label.toLowerCase().includes('push') || o.label.toLowerCase().includes('refund'));

        return (
          <div key={gi} className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-black text-primary tabular-nums">{group.market}</span>
              {isPushLine && (
                <span className="text-[10px] text-slate-400 ml-1">includes push/refund</span>
              )}
            </div>

            <div className={`p-3 grid gap-2 ${mainOpts.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {mainOpts.map((opt) => {
                const match = opt.label.match(/^(.+?)\s*\(([^)]+)\)$/);
                const teamName = match ? match[1] : opt.label;
                const handicap = match ? match[2] : '';
                const selKey = `${opt.label}|${gi}`;

                return (
                  <button
                    key={opt.label}
                    onClick={() => pick('asian_handicap', selKey, opt.odd)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all
                      ${isSel('asian_handicap', selKey)
                        ? 'bg-primary text-white border-primary shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 active:scale-95'
                      }`}
                  >
                    <div className="flex flex-col items-start min-w-0">
                      <span className={`text-sm font-bold truncate ${isSel('asian_handicap', selKey) ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                        {teamName}
                      </span>
                      {handicap && (
                        <span className={`text-[11px] font-black tabular-nums ${isSel('asian_handicap', selKey) ? 'text-white/70' : 'text-primary'}`}>
                          {handicap}
                        </span>
                      )}
                    </div>
                    <span className={`text-lg font-black tabular-nums ml-2 shrink-0 ${isSel('asian_handicap', selKey) ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                      {opt.odd.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

            {pushOpt && (
              <div className="px-3 pb-3">
                <button
                  onClick={() => pick('asian_handicap', `${pushOpt.label}|${gi}`, pushOpt.odd)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all
                    ${isSel('asian_handicap', `${pushOpt.label}|${gi}`)
                      ? 'bg-slate-500 text-white border-slate-500'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400 active:scale-95'
                    }`}
                >
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Push / Refund</span>
                  <span className="text-sm font-black tabular-nums text-slate-600 dark:text-slate-300">{pushOpt.odd.toFixed(2)}</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
type TabKey = '1x2' | 'halfTime' | 'correctScore' | 'handicap' | 'stats' | 'h2h' | 'lineups';

export default function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [match, setMatch]               = useState<Match | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [matchError, setMatchError]     = useState<string | null>(null);

  const [odds1x2, setOdds1x2]                   = useState<OddsGroup[]>([]);
  const [oddsHalfTime, setOddsHalfTime]         = useState<OddsGroup[]>([]);
  const [oddsCorrectScore, setOddsCorrectScore] = useState<OddsGroup[]>([]);
  const [oddsHandicap, setOddsHandicap]         = useState<OddsGroup[]>([]);
  const [loadingOdds, setLoadingOdds]           = useState(false);

  const [stats, setStats]     = useState<StatEntry[]>([]);
  const [h2h, setH2H]         = useState<H2HGame[]>([]);
  const [lineups, setLineups] = useState<LineupsData | null>(null);
  const [loadingTab, setLoadingTab] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('1x2');

  const fetchMatch = useCallback(async () => {
    if (!id) return;
    setLoadingMatch(true);
    setMatchError(null);
    try {
      const res = await publicMatches.getById(id);
      const m = ((res as unknown as Record<string, unknown>).data as Match) ?? (res as unknown as Match);
      setMatch(m);
    } catch (err) {
      setMatchError((err as Error).message ?? 'Failed to load match');
    } finally {
      setLoadingMatch(false);
    }
  }, [id]);

  const fetchAllOdds = useCallback(async () => {
    if (!id) return;
    setLoadingOdds(true);
    try {
      const [r1, r2, r3, r4] = await Promise.allSettled([
        publicMatches.odds(id),
        publicMatches.oddsHalfTime(id),
        publicMatches.oddsCorrectScore(id),
        publicMatches.oddsHandicap(id),
      ]);
      if (r1.status === 'fulfilled') setOdds1x2(parseOddsGroups(r1.value));
      if (r2.status === 'fulfilled') setOddsHalfTime(parseOddsGroups(r2.value));
      if (r3.status === 'fulfilled') setOddsCorrectScore(parseOddsGroups(r3.value));
      if (r4.status === 'fulfilled') setOddsHandicap(parseOddsGroups(r4.value));
    } finally {
      setLoadingOdds(false);
    }
  }, [id]);

  useEffect(() => { fetchMatch(); fetchAllOdds(); }, [fetchMatch, fetchAllOdds]);

  useEffect(() => {
    if (!id) return;

    if (activeTab === 'stats' && !stats.length) {
      setLoadingTab(true);
      publicMatches.stats(id)
        .then((r) => setStats(parseStats(r)))
        .catch(() => {})
        .finally(() => setLoadingTab(false));
    }

    if (activeTab === 'h2h' && !h2h.length) {
      setLoadingTab(true);
      publicMatches.h2h(id)
        .then((r) => setH2H(parseH2H(r)))
        .catch(() => {})
        .finally(() => setLoadingTab(false));
    }

    if (activeTab === 'lineups' && !lineups) {
      setLoadingTab(true);
      publicMatches.lineups(id)
        .then((r) => setLineups(parseLineups(r)))
        .catch(() => {})
        .finally(() => setLoadingTab(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  if (loadingMatch) return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <SkeletonBlock className="h-5 w-20" />
      <div className="card p-6 space-y-4">
        <SkeletonBlock className="h-4 w-32" />
        <div className="flex justify-center gap-6">
          <SkeletonBlock className="h-8 w-24" /><SkeletonBlock className="h-8 w-20" /><SkeletonBlock className="h-8 w-24" />
        </div>
        <SkeletonBlock className="h-4 w-48 mx-auto" />
      </div>
      <div className="flex gap-1">{[0,1,2,3,4,5,6].map((i) => <SkeletonBlock key={i} className="h-10 flex-1" />)}</div>
      <div className="space-y-3">{[0,1,2].map((i) => <SkeletonBlock key={i} className="h-24" />)}</div>
    </div>
  );

  if (matchError || !match) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-sm mb-3">{matchError ?? 'Match not found'}</p>
      <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline">Go back</button>
    </div>
  );

  const isLive     = LIVE_STATUSES.has(match.status ?? '');
  const isFinished = FINISHED_STATUSES.has(match.status ?? '');
  const matchName  = `${match.homeTeam} vs ${match.awayTeam}`;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: '1x2',          label: '1X2',          icon: <SportsIcon fontSize="small" /> },
    { key: 'halfTime',     label: 'Half Time',     icon: <ScheduleIcon fontSize="small" /> },
    { key: 'correctScore', label: 'Correct Score', icon: <SportsIcon fontSize="small" /> },
    { key: 'handicap',     label: 'Handicap',      icon: <SportsIcon fontSize="small" /> },
    { key: 'stats',        label: 'Stats',         icon: <BarChartIcon fontSize="small" /> },
    { key: 'h2h',          label: 'H2H',           icon: <PeopleIcon fontSize="small" /> },
    { key: 'lineups',      label: 'Lineups',       icon: <PeopleIcon fontSize="small" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-4">

        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 mb-4 transition-colors">
          <ArrowBackIcon fontSize="small" /> Back
        </button>

        {/* Match Header */}
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            {match.leagueLogo && <img src={match.leagueLogo} alt={match.league ?? ''} className="w-5 h-5 object-contain" />}
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{match.league ?? '—'}</span>
            {isLive && (
              <span className="flex items-center gap-1 text-xs text-green-500 font-semibold ml-auto">
                <FiberManualRecordIcon sx={{ fontSize: 8 }} className="animate-pulse" />
                LIVE {match.minutePlayed != null ? `${match.minutePlayed}'` : ''}
              </span>
            )}
            {isFinished && <span className="ml-auto text-xs font-bold text-slate-400 uppercase">{finishedLabel(match.status)}</span>}
            <button
              onClick={() => { fetchMatch(); fetchAllOdds(); }}
              className="ml-auto text-slate-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshIcon fontSize="small" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="text-center flex-1 min-w-0">
              {match.homeLogo && <img src={match.homeLogo} alt={match.homeTeam} className="w-12 h-12 object-contain mx-auto mb-2" />}
              <h2 className="font-heading text-base md:text-xl font-bold leading-tight">{match.homeTeam}</h2>
            </div>
            <div className="text-center shrink-0 px-2">
              {(isLive || isFinished) ? (
                <div className="font-heading text-4xl md:text-5xl font-bold text-primary tabular-nums">
                  {match.scoreHome ?? 0}<span className="text-slate-300 dark:text-slate-600 mx-1">–</span>{match.scoreAway ?? 0}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-heading text-2xl font-bold text-slate-700 dark:text-slate-200">{formatKickoff(match.kickoffAt)}</span>
                  <span className="text-xs text-slate-400">Kick-off</span>
                </div>
              )}
            </div>
            <div className="text-center flex-1 min-w-0">
              {match.awayLogo && <img src={match.awayLogo} alt={match.awayTeam} className="w-12 h-12 object-contain mx-auto mb-2" />}
              <h2 className="font-heading text-base md:text-xl font-bold leading-tight">{match.awayTeam}</h2>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            {match.kickoffAt && <span className="flex items-center gap-1"><CalendarTodayIcon sx={{ fontSize: 13 }} />{formatDate(match.kickoffAt)}</span>}
            {match.sport && <span className="flex items-center gap-1"><SportsIcon sx={{ fontSize: 13 }} />{match.sport}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 px-3 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors shrink-0
                ${activeTab === tab.key ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-slate-200'}`}>
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Odds loading spinner */}
        {loadingOdds && ['1x2','halfTime','correctScore','handicap'].includes(activeTab) && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Tab panels */}
        {!loadingOdds && activeTab === '1x2' && (
          <Match1x2Panel groups={odds1x2} matchId={match.id} matchName={matchName} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
        )}
        {!loadingOdds && activeTab === 'halfTime' && (
          <HalfTimePanel groups={oddsHalfTime} matchId={match.id} matchName={matchName} />
        )}
        {!loadingOdds && activeTab === 'correctScore' && (
          <CorrectScorePanel groups={oddsCorrectScore} matchId={match.id} matchName={matchName} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
        )}
        {!loadingOdds && activeTab === 'handicap' && (
          <HandicapPanel groups={oddsHandicap} matchId={match.id} matchName={matchName} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
        )}

        {/* Stats */}
        {activeTab === 'stats' && (
          loadingTab
            ? <div className="card p-4 space-y-4">{[0,1,2,3,4].map((i) => <SkeletonBlock key={i} className="h-8" />)}</div>
            : stats.length > 0
              ? (
                <div className="card p-4 space-y-4">
                  {stats.map((s) => {
                    const total = s.home + s.away || 1;
                    return (
                      <div key={s.label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold tabular-nums">{s.home}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">{s.label}</span>
                          <span className="font-semibold tabular-nums">{s.away}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                          <div className="bg-primary transition-all" style={{ width: `${(s.home / total) * 100}%` }} />
                          <div className="bg-blue-500 transition-all" style={{ width: `${(s.away / total) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-primary inline-block" />{match.homeTeam}</span>
                    <span className="flex items-center gap-1.5">{match.awayTeam}<span className="w-3 h-2 rounded-sm bg-blue-500 inline-block" /></span>
                  </div>
                </div>
              )
              : <p className="text-center text-sm text-slate-400 py-8">No stats available for this match.</p>
        )}

        {/* H2H */}
        {activeTab === 'h2h' && (
          loadingTab
            ? <div className="card p-4 space-y-3">{[0,1,2,3].map((i) => <SkeletonBlock key={i} className="h-12" />)}</div>
            : h2h.length > 0
              ? (
                <div className="card p-4">
                  {h2h.map((game, i) => {
                    const hw = game.homeScore > game.awayScore, aw = game.awayScore > game.homeScore;
                    const dateStr = game.date ? new Date(game.date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                    return (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-2">
                        <div className="flex-1 min-w-0">
                          {dateStr && <p className="text-[11px] text-slate-400 mb-0.5">{dateStr}</p>}
                          <span className={`block text-sm truncate ${hw ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{game.homeTeam}</span>
                          <span className={`block text-sm truncate ${aw ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{game.awayTeam}</span>
                        </div>
                        <div className="flex flex-col items-center shrink-0">
                          <span className={`text-sm font-bold tabular-nums ${hw ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>{game.homeScore}</span>
                          <span className={`text-sm font-bold tabular-nums ${aw ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>{game.awayScore}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
              : <p className="text-center text-sm text-slate-400 py-8">No head-to-head data available.</p>
        )}

        {/* Lineups */}
        {activeTab === 'lineups' && (
          loadingTab
            ? (
              <div className="grid grid-cols-2 gap-4">
                {[0,1].map((i) => (
                  <div key={i} className="card p-4 space-y-2">
                    <SkeletonBlock className="h-4 w-24 mb-3" />
                    {Array.from({ length: 11 }).map((_, j) => <SkeletonBlock key={j} className="h-5" />)}
                  </div>
                ))}
              </div>
            )
            : lineups
              ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { team: match.homeTeam, logo: match.homeLogo, players: lineups.home, color: 'text-primary' },
                    { team: match.awayTeam, logo: match.awayLogo, players: lineups.away, color: 'text-blue-500' },
                  ].map(({ team, logo, players, color }) => (
                    <div key={team} className="card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {logo && <img src={logo} alt={team} className="w-5 h-5 object-contain" />}
                        <h3 className={`font-heading text-sm font-bold truncate ${color}`}>{team}</h3>
                      </div>
                      <div className="space-y-1.5">
                        {players.map((player, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-5 text-xs text-slate-400 tabular-nums shrink-0">{i + 1}</span>
                            <span className="truncate">{player}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
              : <p className="text-center text-sm text-slate-400 py-8">Lineups not available yet.</p>
        )}

      </div>
    </div>
  );
}