import React from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface TradingViewProps {
  data: StatusResponse;
}

export const TradingViewView: React.FC<TradingViewProps> = ({ data }) => {
  const { mode, tradingViewStatus } = data;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                TradingView Readiness Display (Stage 5 Artifact)
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status={tradingViewStatus.status} />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Phase 1 Scope (Section 3.5 #5 & Section 9): TradingView Pine Script v5 indicator (`tradingview/aegis_readiness.pine`) is a visual readiness display only. No webhook, no trade signal, and no fake score are permitted in Phase 1.
            </p>
          </div>
          <Freshness timestamp={tradingViewStatus.updatedAt} staleThresholdSec={60} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">Readiness Verification Checklist</h3>
            <ModeLabel mode={mode} />
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/70">
              <span className="text-slate-300">Symbol Match (XAUUSD / GOLD)</span>
              <StatusBadge status={tradingViewStatus.symbolMatch ? 'READY' : 'WAITING'} />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800/70">
              <span className="text-slate-300">Timeframe Readiness (M1 / M5 / M15)</span>
              <StatusBadge status={tradingViewStatus.timeframeReadiness} />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800/70">
              <span className="text-slate-300">Confirmed Bar Flag (barstate.isconfirmed)</span>
              <span className="font-mono text-slate-200">ENFORCED IN PINE V5</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800/70">
              <span className="text-slate-300">Webhook / Order Signal Generation</span>
              <StatusBadge status="DISABLED_IN_PHASE_1" />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-300">External TradingView Chart Verification (Blocker B7)</span>
              <StatusBadge status="NOT VERIFIED" />
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">Pine Script v5 Readiness Table Spec</h3>
            <span className="text-xs font-mono text-slate-400">tradingview/aegis_readiness.pine</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Stage 5 Pine Script v5 indicator (`tradingview/aegis_readiness.pine`) renders a compact on-chart table checking:
          </p>
          <ul className="text-xs text-slate-300 space-y-2 font-mono">
            <li>1. Symbol Match: syminfo.ticker contains XAUUSD or GOLD</li>
            <li>2. Timeframe Match: timeframe.period in (&quot;1&quot;, &quot;5&quot;, &quot;15&quot;)</li>
            <li>3. History Depth: bar_index + 1 &gt;= minBarsRequired (200)</li>
            <li>4. Last Confirmed Close: timestamp formatted in UTC on barstate.isconfirmed</li>
            <li>5. Overall Readiness State: READY | WAITING | ERROR</li>
          </ul>
          <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <strong className="text-slate-200">Founder Verification Note (B7):</strong> Attach{' '}
            <code className="text-amber-300">tradingview/aegis_readiness.pine</code> to a TradingView XAUUSD chart across M15, M5, and M1 to complete external visual readiness verification.
          </div>
        </div>
      </div>
    </div>
  );
};
