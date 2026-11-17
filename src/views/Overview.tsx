import React from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface OverviewProps {
  data: StatusResponse;
  onNavigate: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewProps> = ({ data, onNavigate }) => {
  const { mode, systemStatus, accountStatus, marketSummary, riskState, tradingViewStatus, alerts, brains } = data;
  const isHealthy = systemStatus.overallHealth === 'HEALTHY';

  return (
    <div className="space-y-6">
      {/* Overall System Banner - turns amber/red when any source is stale or unverified */}
      <div
        className={`rounded-lg border p-5 ${
          isHealthy
            ? 'bg-emerald-950/20 border-emerald-800/60'
            : 'bg-amber-950/25 border-amber-700/70'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {isHealthy ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-semibold text-slate-100">
                  Overall System Status: {systemStatus.overallHealth}
                </h2>
                <ModeLabel mode={mode} />
                <StatusBadge status={systemStatus.executionLock} />
              </div>
              <p className="text-sm text-slate-300 mt-1">{systemStatus.overallReason}</p>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <span className="text-xs text-slate-400">Active Governance Scope</span>
            <span className="text-xs font-mono text-slate-200">{systemStatus.phase}</span>
            <Freshness timestamp={systemStatus.updatedAt} staleThresholdSec={30} />
          </div>
        </div>
      </div>

      {/* Primary KPI Grid - Max 4 cards in a single row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: EA Telemetry & Heartbeat */}
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">EA Telemetry</span>
            <ModeLabel mode={mode} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={systemStatus.eaConnected ? 'CONNECTED' : 'NOT VERIFIED'} />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono tabular-nums">
              Instance: {accountStatus.instanceId ?? 'NONE'} · Seq #{accountStatus.lastSequenceNumber}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Freshness</span>
            <Freshness timestamp={systemStatus.lastTelemetryAt} staleThresholdSec={30} />
          </div>
        </div>

        {/* Card 2: XAUUSD Quote & Spread */}
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">XAUUSD Feed</span>
            <ModeLabel mode={mode} />
          </div>
          <div>
            {marketSummary.verified && marketSummary.bid !== null && marketSummary.ask !== null ? (
              <div>
                <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                  {marketSummary.bid.toFixed(2)} / {marketSummary.ask.toFixed(2)}
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                  Spread: {marketSummary.spreadPoints} pts · Session: {marketSummary.sessionName}
                </p>
              </div>
            ) : (
              <div>
                <StatusBadge status="NOT VERIFIED" />
                <p className="text-xs text-slate-400 mt-2">
                  No verified {mode} quote received from MT5 EA.
                </p>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Quote Time</span>
            <Freshness timestamp={marketSummary.updatedAt} staleThresholdSec={30} />
          </div>
        </div>

        {/* Card 3: Account Equity & Floating P/L */}
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Account Balance / Equity</span>
            <ModeLabel mode={mode} />
          </div>
          <div>
            {accountStatus.verified && accountStatus.balance !== null && accountStatus.equity !== null ? (
              <div>
                <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                  ${accountStatus.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                  Bal: ${accountStatus.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} · Float:{' '}
                  {(accountStatus.floatingPnL ?? 0) >= 0 ? '+' : ''}
                  {(accountStatus.floatingPnL ?? 0).toFixed(2)}
                </p>
              </div>
            ) : (
              <div>
                <StatusBadge status="NOT VERIFIED" />
                <p className="text-xs text-slate-400 mt-2">
                  Awaiting verified {mode} broker account telemetry.
                </p>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Account Sync</span>
            <Freshness timestamp={accountStatus.updatedAt} staleThresholdSec={30} />
          </div>
        </div>

        {/* Card 4: Risk & Supervisor State */}
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Risk & Supervisor</span>
            <ModeLabel mode={mode} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={riskState.supervisorState} />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono tabular-nums">
              Risk/Trade: {riskState.riskPerTradePct.toFixed(2)}% · Max Daily: {riskState.maxDailyLossPct.toFixed(1)}% · Max Pos: {riskState.maxOpenPositions}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">State Time</span>
            <Freshness timestamp={riskState.updatedAt} staleThresholdSec={30} />
          </div>
        </div>
      </div>

      {/* Two-Column Detail Section: Subsystem Verification Table + Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Source Verification Matrix */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Subsystem Telemetry & Phase 1 Verification Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every subsystem explicitly reports its mode, verification state, and last update timestamp.
              </p>
            </div>
            <ModeLabel mode={mode} />
          </div>
          <div className="divide-y divide-slate-800/80 text-sm">
            <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-slate-200">MT5 Expert Advisor Read-Only Telemetry</div>
                <div className="text-xs text-slate-400">
                  Broker: {accountStatus.brokerName ?? 'NOT VERIFIED'} · Server: {accountStatus.serverName ?? 'NOT VERIFIED'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ModeLabel mode={mode} />
                <StatusBadge status={accountStatus.verified ? 'VERIFIED' : 'NOT VERIFIED'} />
                <Freshness timestamp={accountStatus.updatedAt} staleThresholdSec={30} />
              </div>
            </div>

            <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-slate-200">TradingView Readiness Indicator (Pine v5)</div>
                <div className="text-xs text-slate-400">{tradingViewStatus.note}</div>
              </div>
              <div className="flex items-center gap-3">
                <ModeLabel mode={mode} />
                <StatusBadge status={tradingViewStatus.status} />
                <Freshness timestamp={tradingViewStatus.updatedAt} staleThresholdSec={60} />
              </div>
            </div>

            <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-slate-200">12-Brain Intelligence Engine</div>
                <div className="text-xs text-slate-400">
                  Phase 1 restriction: All {brains.length} Brains explicitly report NOT IMPLEMENTED (zero fabricated AI output).
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status="NOT IMPLEMENTED" />
                <button
                  onClick={() => onNavigate('brains')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
                >
                  Inspect 12 Brains
                </button>
              </div>
            </div>

            <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-slate-200">Phase 1 Command & Order Endpoints</div>
                <div className="text-xs text-slate-400">
                  All Class N, Class R, and Class A write endpoints are hard-locked to HTTP 403 in Phase 1.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status="READ_ONLY_MONITORING" />
                <button
                  onClick={() => onNavigate('connection')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
                >
                  Open Telemetry Harness
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Alerts Summary */}
        <div className="bg-[#111827] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Active Transition Alerts</h3>
              <p className="text-xs text-slate-400 mt-0.5">State-transition alerts for {mode} mode</p>
            </div>
            <ModeLabel mode={mode} />
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between gap-4">
            {alerts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">No transition alerts recorded for {mode} mode.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Alerts emit only on state transitions (e.g., CONNECTED → STALE).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded border border-slate-800 bg-slate-900/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={alert.severity} />
                      <Freshness timestamp={alert.createdAt} staleThresholdSec={300} />
                    </div>
                    <div className="text-xs font-semibold text-slate-200">{alert.title}</div>
                    <p className="text-xs text-slate-400">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total {mode} Alerts: {alerts.length}</span>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
              >
                View Alert Log →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
