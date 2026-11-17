import React from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface StrategyViewProps {
  data: StatusResponse;
}

const STRATEGY_CANDIDATES = [
  {
    id: 'CANDIDATE_A',
    name: 'Candidate A — Liquidity Sweep + Displacement Reversal',
    hypothesis: 'After an M15/M5 session high/low or equal-level sweep with wick/close reclaim (Brain 04), an M5 CHOCH/MSS with strong ATR-normalized displacement (Brain 08) and FVG/OB retest (Brain 09) offers asymmetric continuation back into the dealing range.',
    timeframes: 'M15 Bias / M5 Setup / M1 Trigger',
    allowedSessions: 'London Open, London-NY Overlap',
    status: 'NOT IMPLEMENTED (Phase 2)',
    trialCount: 0,
  },
  {
    id: 'CANDIDATE_B',
    name: 'Candidate B — Trend Regime Pullback into Discount/Premium OB/FVG',
    hypothesis: 'During clean M15 directional trend regimes (Brain 02) aligned with macro/correlation posture (Brains 01, 03), pullbacks past 50% equilibrium into an unmitigated M5 Order Block / FVG (Brain 09) with M1 micro-BOS resume the primary trend.',
    timeframes: 'M15 Trend / M5 Zone / M1 Confirmation',
    allowedSessions: 'London, New York',
    status: 'NOT IMPLEMENTED (Phase 2)',
    trialCount: 0,
  },
  {
    id: 'CANDIDATE_C',
    name: 'Candidate C — Session Range Breakout & Re-Accumulation',
    hypothesis: 'Following compressed Asian session range volatility (Brain 07, Brain 10), an impulsive London/NY displacement break that holds above/below range structure without sweep rejection continues toward external liquidity.',
    timeframes: 'M15 Range / M5 Break / M1 Retest',
    allowedSessions: 'London Open, NY Open',
    status: 'NOT IMPLEMENTED (Phase 2)',
    trialCount: 0,
  },
];

export const StrategyView: React.FC<StrategyViewProps> = ({ data }) => {
  const { mode, systemStatus } = data;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                Strategy Research Lab (Section 7 Protocol)
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status="NO_STRATEGY_SELECTED" />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              No strategy is assumed profitable before testing. In Phase 1, all 3 candidates have 0 trials and remain in specification state until Phase 2 historical research and walk-forward validation.
            </p>
          </div>
          <Freshness timestamp={systemStatus.updatedAt} staleThresholdSec={60} />
        </div>
      </div>

      {/* Candidate Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {STRATEGY_CANDIDATES.map((cand) => (
          <div
            key={cand.id}
            className="bg-[#111827] border border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono text-amber-400 font-semibold">{cand.id}</span>
                <StatusBadge status="NOT IMPLEMENTED" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{cand.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{cand.hypothesis}</p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Timeframes:</span>
                <span className="text-slate-200">{cand.timeframes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sessions:</span>
                <span className="text-slate-200">{cand.allowedSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recorded Trials:</span>
                <span className="text-slate-200 tabular-nums">{cand.trialCount} (n = 0)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 7.2 – 7.4 Mandatory Research & Anti-Overfitting Protocol */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
          Mandatory Phase 2 Cost Model, Out-of-Sample & Walk-Forward Discipline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-200">Realistic Cost Model (Section 7.2)</div>
            <p className="text-slate-400">
              Every historical and paper test must include normal spread, volatile/news spread stress, commission, swap/rollover, normal slippage, stressed slippage, and partial/rejected fill simulation.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-200">In-Sample / OOS / Walk-Forward Split (Section 7.4)</div>
            <p className="text-slate-400">
              Historical data is strictly partitioned into In-Sample (development), Validation (comparison), and Out-of-Sample (untouched final test), followed by rolling Walk-Forward Analysis and parameter perturbation checks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
