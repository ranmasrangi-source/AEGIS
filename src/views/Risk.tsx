import React from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface RiskViewProps {
  data: StatusResponse;
}

export const RiskView: React.FC<RiskViewProps> = ({ data }) => {
  const { mode, riskState } = data;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                Risk & Supervisor State (Approved Safety Envelope)
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status={riskState.supervisorState} />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Displays hard risk caps, realized vs. floating P/L separation, consecutive loss circuit breaker, and fail-closed CS/AR supervisor states.
            </p>
          </div>
          <Freshness timestamp={riskState.updatedAt} staleThresholdSec={30} />
        </div>
      </div>

      {/* Approved Safety Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">Risk Per Trade Cap</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
            {riskState.riskPerTradePct.toFixed(2)}%
          </div>
          <p className="text-xs text-slate-400">Approved ceiling: 0.25% – 0.50% of equity</p>
          <Freshness timestamp={riskState.updatedAt} staleThresholdSec={30} />
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">Daily Loss Limit (2.0%)</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="text-sm font-mono text-slate-200 tabular-nums space-y-1">
            <div>
              Realized:{' '}
              <span className="font-semibold">
                {riskState.realizedDailyPnL !== null ? `$${riskState.realizedDailyPnL.toFixed(2)}` : 'NOT VERIFIED'}
              </span>
            </div>
            <div>
              Floating:{' '}
              <span className="font-semibold">
                {riskState.floatingPnL !== null ? `$${riskState.floatingPnL.toFixed(2)}` : 'NOT VERIFIED'}
              </span>
            </div>
          </div>
          <Freshness timestamp={riskState.updatedAt} staleThresholdSec={30} />
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">Weekly Loss Limit (5.0%)</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="text-sm font-mono text-slate-200 tabular-nums space-y-1">
            <div>
              Realized:{' '}
              <span className="font-semibold">
                {riskState.realizedWeeklyPnL !== null ? `$${riskState.realizedWeeklyPnL.toFixed(2)}` : 'NOT VERIFIED'}
              </span>
            </div>
            <div className="text-xs text-slate-400">Reset boundary: EC-2 (UNRESOLVED — fail-closed)</div>
          </div>
          <Freshness timestamp={riskState.updatedAt} staleThresholdSec={30} />
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">Loss Streak & Max Pos</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
            {riskState.consecutiveLosses} / {riskState.maxConsecutiveLosses} Losses
          </div>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            Pause: {riskState.pauseDurationMinutes}m · Open Pos: {riskState.openPositionsCount}/{riskState.maxOpenPositions}
          </p>
          <Freshness timestamp={riskState.updatedAt} staleThresholdSec={30} />
        </div>
      </div>

      {/* Section 6.14 Mandatory EA-Local Protections vs Optional Brain 12 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
            Mandatory Local EA Protections (Never Dependent on Cloud/AI)
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 font-mono">
            <li>• Initial physical Stop Loss at order placement (Phase 3)</li>
            <li>• Risk-per-trade cap (0.50%), Daily (2.0%) & Weekly (5.0%) loss locks</li>
            <li>• 3 consecutive losses → mandatory 180-minute pause</li>
            <li>• Maximum 1 open XAUUSD position, zero martingale/grid/averaging down</li>
            <li>• Local spread, slippage, margin, and execution latency hard gates (BA-3)</li>
            <li>• Emergency close-all and trading lock inside MT5 EA</li>
          </ul>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
            Fail-Closed Unresolved Safety Policies (CS / AR)
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">CS-1..CS-8 (Capital & Risk Edge Cases)</span>
              <StatusBadge status={riskState.failClosedStatus.csResolved ? 'APPROVED' : 'UNRESOLVED'} />
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">AR-1..AR-8 (Architecture & Recovery Rules)</span>
              <StatusBadge status={riskState.failClosedStatus.arResolved ? 'APPROVED' : 'UNRESOLVED'} />
            </div>
            <p className="text-slate-400 leading-relaxed pt-1">
              {riskState.failClosedStatus.reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
