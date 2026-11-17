/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { OwnerGate } from './auth/OwnerGate.tsx';
import { fetchSystemStatus, StatusResponse, TradingMode } from './lib/api.ts';
import { StatusBadge } from './components/Status.tsx';
import { ModeLabel } from './components/ModeLabel.tsx';
import { Freshness } from './components/Freshness.tsx';
import { OverviewView } from './views/Overview.tsx';
import { BrainsView } from './views/Brains.tsx';
import { MarketView } from './views/Market.tsx';
import { TradingViewView } from './views/TradingView.tsx';
import { ConnectionView } from './views/Connection.tsx';
import { RiskView } from './views/Risk.tsx';
import { StrategyView } from './views/Strategy.tsx';
import { TradesView } from './views/Trades.tsx';
import { HealthView } from './views/Health.tsx';
import { AlertsView } from './views/Alerts.tsx';
import { LogsView } from './views/Logs.tsx';
import { SettingsView } from './views/Settings.tsx';
import {
  LayoutDashboard,
  Cpu,
  LineChart,
  Tv,
  Radio,
  ShieldCheck,
  FlaskConical,
  History,
  Activity,
  Bell,
  FileText,
  Settings,
  RefreshCw,
} from 'lucide-react';

type TabId =
  | 'overview'
  | 'brains'
  | 'market'
  | 'tradingview'
  | 'connection'
  | 'risk'
  | 'strategy'
  | 'trades'
  | 'health'
  | 'alerts'
  | 'logs'
  | 'settings';

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
  { id: 'brains', label: '2. 12 Brains', icon: Cpu },
  { id: 'market', label: '3. Market (XAUUSD)', icon: LineChart },
  { id: 'tradingview', label: '4. TradingView', icon: Tv },
  { id: 'connection', label: '5. EA Connection', icon: Radio },
  { id: 'risk', label: '6. Risk & Supervisor', icon: ShieldCheck },
  { id: 'strategy', label: '7. Strategy Lab', icon: FlaskConical },
  { id: 'trades', label: '8. Trade History', icon: History },
  { id: 'health', label: '9. System Health', icon: Activity },
  { id: 'alerts', label: '10. Alerts', icon: Bell },
  { id: 'logs', label: '11. Logs & Audit', icon: FileText },
  { id: 'settings', label: '12. Settings', icon: Settings },
];

export default function App() {
  const [mode, setMode] = useState<TradingMode>('DEMO');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async (selectedMode: TradingMode) => {
    try {
      const res = await fetchSystemStatus(selectedMode);
      setStatusData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadStatus(mode);
    const interval = setInterval(() => {
      loadStatus(mode);
    }, 10000);
    return () => clearInterval(interval);
  }, [mode, loadStatus]);

  return (
    <OwnerGate>
      <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col md:flex-row">
        {/* Left Sidebar Navigation (Desktop) */}
        <aside className="w-full md:w-64 bg-[#0D1322] border-b md:border-b-0 md:border-r border-slate-800 shrink-0 flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                  AEGIS XAU · V1.0
                </div>
                <h1 className="text-sm font-bold text-slate-100 mt-0.5">
                  Phase 1 Read-Only Monitor
                </h1>
              </div>
              <ModeLabel mode={mode} />
            </div>

            {/* Mode Switcher — Strictly separates DEMO and LIVE views */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/40">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1.5">
                Telemetry View Partition
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setMode('DEMO')}
                  className={`py-1.5 px-2 rounded text-xs font-mono font-semibold border transition cursor-pointer ${
                    mode === 'DEMO'
                      ? 'bg-sky-950/80 text-sky-300 border-sky-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  DEMO VIEW
                </button>
                <button
                  onClick={() => setMode('LIVE')}
                  className={`py-1.5 px-2 rounded text-xs font-mono font-semibold border transition cursor-pointer ${
                    mode === 'LIVE'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  LIVE (LOCKED)
                </button>
              </div>
            </div>

            {/* 12-Section Navigation */}
            <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden md:block p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Phase 1 Lock:</span>
              <span className="font-mono text-emerald-400">ENFORCED</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trade Execution:</span>
              <span className="font-mono text-rose-400">DISABLED</span>
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Status Header */}
          <header className="bg-[#0D1322] border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <ModeLabel mode={mode} />
              {statusData && (
                <>
                  <StatusBadge status={statusData.systemStatus.overallHealth} />
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Symbol: <strong className="text-slate-200 font-mono">XAUUSD</strong>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {statusData && (
                <Freshness timestamp={statusData.systemStatus.updatedAt} staleThresholdSec={30} />
              )}
              <button
                onClick={() => loadStatus(mode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </header>

          {/* Content Container */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-200">
                <strong>Telemetry Status Error:</strong> {error}
              </div>
            )}

            {!statusData ? (
              <div className="p-12 text-center text-sm text-slate-400">
                Loading verified {mode} status telemetry...
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <OverviewView
                    data={statusData}
                    onNavigate={(tab) => setActiveTab(tab as TabId)}
                  />
                )}
                {activeTab === 'brains' && (
                  <BrainsView brains={statusData.brains} mode={mode} />
                )}
                {activeTab === 'market' && <MarketView data={statusData} />}
                {activeTab === 'tradingview' && <TradingViewView data={statusData} />}
                {activeTab === 'connection' && (
                  <ConnectionView
                    data={statusData}
                    onRefresh={() => loadStatus(mode)}
                  />
                )}
                {activeTab === 'risk' && <RiskView data={statusData} />}
                {activeTab === 'strategy' && <StrategyView data={statusData} />}
                {activeTab === 'trades' && <TradesView data={statusData} />}
                {activeTab === 'health' && <HealthView data={statusData} />}
                {activeTab === 'alerts' && <AlertsView data={statusData} />}
                {activeTab === 'logs' && <LogsView data={statusData} />}
                {activeTab === 'settings' && <SettingsView data={statusData} />}
              </>
            )}
          </main>
        </div>
      </div>
    </OwnerGate>
  );
}
