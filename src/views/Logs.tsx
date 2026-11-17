import React, { useState } from 'react';
import { StatusResponse } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface LogsViewProps {
  data: StatusResponse;
}

export const LogsView: React.FC<LogsViewProps> = ({ data }) => {
  const { mode, logs, auditRecords, systemStatus } = data;
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');

  const filteredLogs = logs.filter((l) => (filterLevel === 'ALL' ? true : l.level === filterLevel));

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                Telemetry Event Logs & Immutable Admin Audit Trail
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status="APPEND_ONLY_AUDIT" />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Every accepted or rejected EA telemetry packet and every disabled command probe is recorded with its cryptographic status and rejection reason.
            </p>
          </div>
          <Freshness timestamp={systemStatus.updatedAt} staleThresholdSec={30} />
        </div>
      </div>

      {/* Telemetry Logs Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-100">
              {mode} Telemetry Log (`logs_{mode.toLowerCase()}`)
            </h3>
            <ModeLabel mode={mode} />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded font-mono cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No {filterLevel !== 'ALL' ? filterLevel : ''} telemetry logs recorded for {mode} mode yet. Use the Connection view harness to send signed or invalid packets.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{log.createdAt}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={log.level} />
                    </td>
                    <td className="py-3 px-4 text-amber-300 whitespace-nowrap">{log.eventType}</td>
                    <td className="py-3 px-4 font-sans text-slate-200">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Immutable Admin Audit Trail */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            Immutable Security & Admin Audit Trail (`admin_audit`)
          </h3>
          <span className="text-xs font-mono text-slate-400">{auditRecords.length} records</span>
        </div>

        {auditRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No security audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {auditRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{rec.createdAt}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={rec.outcome} />
                    </td>
                    <td className="py-3 px-4 text-slate-200">{rec.action}</td>
                    <td className="py-3 px-4 text-slate-400">{rec.actorEmail ?? rec.actorUid}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{rec.reason}</td>
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
