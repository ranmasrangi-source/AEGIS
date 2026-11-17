import React from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface MarketViewProps {
  data: StatusResponse;
}

export const MarketView: React.FC<MarketViewProps> = ({ data }) => {
  const { mode, marketSummary, accountStatus } = data;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                XAUUSD Multi-Timeframe Market Analysis
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status={marketSummary.verified ? 'VERIFIED' : 'NOT VERIFIED'} />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Displays verified MT5 EA market telemetry for {mode} mode. Multi-timeframe directional and setup states remain NOT IMPLEMENTED until Phase 2 Brain activation.
            </p>
          </div>
          <Freshness timestamp={marketSummary.updatedAt} staleThresholdSec={30} />
        </div>
      </div>

      {/* Live Quote & Symbol Specification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Symbol & Quote</span>
            <ModeLabel mode={mode} />
          </div>
          {marketSummary.verified && marketSummary.bid !== null && marketSummary.ask !== null ? (
            <div className="space-y-1">
              <div className="text-lg font-mono font-semibold text-slate-100 tabular-nums">
                {marketSummary.symbol}: {marketSummary.bid.toFixed(2)} / {marketSummary.ask.toFixed(2)}
              </div>
              <div className="text-xs font-mono text-slate-400 tabular-nums">
                Spread: {marketSummary.spreadPoints} points ({accountStatus.digits ?? 2} digits)
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <StatusBadge status="NOT VERIFIED" />
              <p className="text-xs text-slate-400">No verified {mode} quote available.</p>
            </div>
          )}
          <Freshness timestamp={marketSummary.updatedAt} staleThresholdSec={30} />
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Session & Volatility</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-mono text-slate-200">
              Session: <span className="font-semibold">{marketSummary.sessionName}</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Volatility State: {marketSummary.volatilityState} · Regime: {marketSummary.regimeState}
            </div>
          </div>
          <Freshness timestamp={marketSummary.updatedAt} staleThresholdSec={30} />
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">MT5 Historical Bar Counts</span>
            <ModeLabel mode={mode} />
          </div>
          {marketSummary.barCounts ? (
            <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums pt-1">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400">M15</div>
                <div className="text-slate-100 font-semibold">{marketSummary.barCounts.m15}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400">M5</div>
                <div className="text-slate-100 font-semibold">{marketSummary.barCounts.m5}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400">M1</div>
                <div className="text-slate-100 font-semibold">{marketSummary.barCounts.m1}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <StatusBadge status="NOT VERIFIED" />
              <p className="text-xs text-slate-400">Awaiting verified EA bar history telemetry.</p>
            </div>
          )}
          <Freshness timestamp={marketSummary.updatedAt} staleThresholdSec={30} />
        </div>
      </div>

      {/* Multi-Timeframe Role Table (Section 4.3 & Section 10.2) */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            Timeframe Responsibilities & Confirmed Close State
          </h3>
          <ModeLabel mode={mode} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-3 px-4">Timeframe</th>
                <th className="py-3 px-4">Architecture Role</th>
                <th className="py-3 px-4">Bar Count</th>
                <th className="py-3 px-4">Last Confirmed Close</th>
                <th className="py-3 px-4">Phase 1 State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-200">M15</td>
                <td className="py-3.5 px-4 font-sans text-slate-300">
                  Directional bias, major liquidity pools, dealing range, regime context
                </td>
                <td className="py-3.5 px-4 text-slate-200">
                  {marketSummary.barCounts?.m15 ?? 'NOT VERIFIED'}
                </td>
                <td className="py-3.5 px-4 text-slate-200">
                  {marketSummary.lastClosedBarTimes?.m15
                    ? new Date(marketSummary.lastClosedBarTimes.m15 * 1000).toISOString()
                    : 'NOT VERIFIED'}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={marketSummary.m15Direction} />
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-200">M5</td>
                <td className="py-3.5 px-4 font-sans text-slate-300">
                  Setup confirmation, sweep validation, CHOCH/BOS/MSS, displacement, OB/FVG quality
                </td>
                <td className="py-3.5 px-4 text-slate-200">
                  {marketSummary.barCounts?.m5 ?? 'NOT VERIFIED'}
                </td>
                <td className="py-3.5 px-4 text-slate-200">
                  {marketSummary.lastClosedBarTimes?.m5
                    ? new Date(marketSummary.lastClosedBarTimes.m5 * 1000).toISOString()
                    : 'NOT VERIFIED'}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={marketSummary.m5Confirmation} />
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-200">M1</td>
                <td className="py-3.5 px-4 font-sans text-slate-300">
                  Entry trigger refinement, micro-structure confirmation, spread/slippage check
                </td>
                <td className="py-3.5 px-4 text-slate-200">
                  {marketSummary.barCounts?.m1 ?? 'NOT VERIFIED'}
                </td>
                <td className="py-3.5 px-4 text-slate-200">
                  {marketSummary.lastClosedBarTimes?.m1
                    ? new Date(marketSummary.lastClosedBarTimes.m1 * 1000).toISOString()
                    : 'NOT VERIFIED'}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={marketSummary.m1Readiness} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
