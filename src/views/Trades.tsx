import React from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface TradesViewProps {
  data: StatusResponse;
}

export const TradesView: React.FC<TradesViewProps> = ({ data }) => {
  const { mode, trades, systemStatus } = data;
  const sampleSize = trades.length;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                Verified Trade History & Sample-Size Metrics
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status="READ_ONLY_PHASE_1" />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Strictly isolated {mode} trade ledger (`trades_{mode.toLowerCase()}`). Per Section 10.2, sample size (n = {sampleSize}) is displayed beside every performance ratio, and DEMO and LIVE histories are never combined.
            </p>
          </div>
          <Freshness timestamp={systemStatus.updatedAt} staleThresholdSec={60} />
        </div>
      </div>

      {/* Performance Summary with Mandatory Sample Size beside every ratio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">Verified Sample Size</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
            n = {sampleSize} trades
          </div>
          <p className="text-xs text-slate-500">Phase 1 execution disabled (0 trades)</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">Win Rate (n = {sampleSize})</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
            N/A (n = {sampleSize})
          </div>
          <p className="text-xs text-slate-500">Requires verified closed trades</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">Profit Factor (n = {sampleSize})</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
            N/A (n = {sampleSize})
          </div>
          <p className="text-xs text-slate-500">Net after spread, commission & swap</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">Expectancy (n = {sampleSize})</span>
            <ModeLabel mode={mode} />
          </div>
          <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
            N/A (n = {sampleSize})
          </div>
          <p className="text-xs text-slate-500">R-multiple & net USD per trade</p>
        </div>
      </div>

      {/* Trade Ledger Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            {mode} Verified Broker Execution Ledger (trades_{mode.toLowerCase()})
          </h3>
          <ModeLabel mode={mode} />
        </div>
        {trades.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <StatusBadge status="NO_TRADES_IN_PHASE_1" />
            <p className="text-sm text-slate-300 mt-2">
              Zero {mode} trades recorded (n = 0).
            </p>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Phase 1 is strictly read-only. Trade execution functions (OrderSend, OrderSendAsync, PositionModify, PositionClose, CTrade) are excluded from the Phase 1 MT5 Expert Advisor by compile-time guard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Side</th>
                  <th className="py-3 px-4">Lots</th>
                  <th className="py-3 px-4">Net P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {trades.map((tr, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4 text-slate-200">{String(tr.ticket ?? '—')}</td>
                    <td className="py-3 px-4">
                      <ModeLabel mode={mode} />
                    </td>
                    <td className="py-3 px-4 text-slate-200">{String(tr.symbol ?? 'XAUUSD')}</td>
                    <td className="py-3 px-4 text-slate-200">{String(tr.side ?? '—')}</td>
                    <td className="py-3 px-4 text-slate-200">{String(tr.volume ?? '—')}</td>
                    <td className="py-3 px-4 text-slate-200">{String(tr.netProfit ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
