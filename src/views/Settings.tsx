import React from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface SettingsViewProps {
  data: StatusResponse;
}

const GOVERNANCE_DECISION_SUMMARY = [
  { id: 'CS-1..CS-8', category: 'Capital & Risk Edge Cases', status: 'UNRESOLVED', impact: 'Blocks Phase 3 execution; fail-closed in Phase 1.' },
  { id: 'AR-1..AR-8', category: 'Architecture & Failover Edge Cases', status: 'UNRESOLVED', impact: 'Blocks Phase 3 execution; fail-closed in Phase 1.' },
  { id: 'EA-5', category: 'Heartbeat Staleness Threshold', status: 'PROPOSED_DEFAULT (30s)', impact: 'Used by Phase 1 heartbeat monitor (TODO EA-5).' },
  { id: 'OS-7', category: 'Clock Skew Tolerance', status: 'PROPOSED_DEFAULT (30s)', impact: 'Used by Stage 3 telemetry validator (TODO OS-7).' },
  { id: 'OS-11', category: 'Telemetry Signing Scheme', status: 'PROPOSED_DEFAULT (HMAC_SHA256)', impact: 'Configurable interface supporting HMAC/Ed25519/RSA (TODO OS-11).' },
  { id: 'DB-2', category: 'Phase 1 Alert Acknowledgement', status: 'PROPOSED_DEFAULT (Disabled)', impact: 'Browser cannot write alerts in Phase 1 (TODO DB-2).' },
  { id: 'B1..B5', category: 'Windows MetaEditor & Exness Demo Runtime', status: 'NOT VERIFIED', impact: 'External Windows MT5 host verification required before Phase 1 PASS.' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ data }) => {
  const { mode, riskState, systemStatus } = data;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                System Settings & Governance Decision Register (Read-Only in Phase 1)
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status="READ_ONLY_PHASE_1" />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Per V4.1 Section 6 and Construction Blueprint V1.0 Section 3.5 #4, all settings are strictly read-only in Phase 1. Even in later phases, no UI control can ever raise risk caps above approved Founder limits.
            </p>
          </div>
          <Freshness timestamp={systemStatus.updatedAt} staleThresholdSec={60} />
        </div>
      </div>

      {/* Read-Only Safety Parameter Inspection */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
          Immutable Founder Safety Ceilings (V4 / V4.1 Higher-Authority Envelope)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-slate-400">Owner Identity Lock</div>
            <div className="text-slate-100 font-semibold">adventurenepal04@gmail.com</div>
            <div className="text-[11px] text-slate-500">Single-owner authentication enforced</div>
          </div>
          <div className="p-3.5 rounded bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-slate-400">Max Risk / Daily / Weekly Loss</div>
            <div className="text-slate-100 font-semibold tabular-nums">
              {riskState.riskPerTradePct.toFixed(2)}% / {riskState.maxDailyLossPct.toFixed(1)}% / {riskState.maxWeeklyLossPct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500">Cannot be increased via UI in any phase</div>
          </div>
          <div className="p-3.5 rounded bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-slate-400">Loss Streak / Pause / Max Positions</div>
            <div className="text-slate-100 font-semibold tabular-nums">
              {riskState.maxConsecutiveLosses} losses → {riskState.pauseDurationMinutes}m pause · Max {riskState.maxOpenPositions} pos
            </div>
            <div className="text-[11px] text-slate-500">Zero Martingale / Zero Grid / Zero Averaging</div>
          </div>
        </div>
      </div>

      {/* Decision Register Summary */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            Decision Register Status (`docs/DECISIONS.md`)
          </h3>
          <span className="text-xs font-mono text-slate-400">Explicit Status Tracking</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-3 px-4">Decision ID</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Governance Status</th>
                <th className="py-3 px-4">Phase 1 Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {GOVERNANCE_DECISION_SUMMARY.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 font-mono font-semibold text-amber-300">{item.id}</td>
                  <td className="py-3 px-4 text-slate-200">{item.category}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-300">{item.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
