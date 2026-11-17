import React from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface AlertsViewProps {
  data: StatusResponse;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ data }) => {
  const { mode, alerts, systemStatus } = data;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                Transition-Based System Alerts ({mode} Mode)
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status="ACK_DISABLED_DB_2" />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Alerts fire only on state transitions (e.g., CONNECTED → STALE). Per Decision DB-2 and Firestore Phase 1 rules, browser alert acknowledgement writes are disabled in Phase 1.
            </p>
          </div>
          <Freshness timestamp={systemStatus.updatedAt} staleThresholdSec={30} />
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            Alert History ({alerts.length} records in {mode} mode)
          </h3>
          <ModeLabel mode={mode} />
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-slate-300">No transition alerts recorded for {mode} mode.</p>
            <p className="text-xs text-slate-500">
              When an EA heartbeat crosses the 30-second threshold or recovers, a single transition alert is logged here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={alert.severity} />
                    <ModeLabel mode={alert.mode} />
                    <span className="text-xs font-mono text-slate-400">{alert.category}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{alert.title}</div>
                  <p className="text-xs text-slate-300">{alert.message}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <Freshness timestamp={alert.createdAt} staleThresholdSec={300} />
                  <span className="text-[11px] font-mono text-slate-500">{alert.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
