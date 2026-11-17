import React, { useState } from 'react';
import { StatusResponse, probeDisabledEndpoint } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';
import { Lock } from 'lucide-react';

interface HealthViewProps {
  data: StatusResponse;
}

const DISABLED_ENDPOINTS = [
  { path: '/api/commands', label: 'Class N / Class R EA Command Dispatch (/api/commands)' },
  { path: '/api/orders', label: 'Trade Execution Endpoint (/api/orders)' },
  { path: '/api/emergency/close-all', label: 'Emergency Close-All Command (/api/emergency/close-all)' },
  { path: '/api/settings', label: 'Class A Dashboard Settings Mutation (/api/settings)' },
  { path: '/api/alerts/acknowledge', label: 'Alert Acknowledgement Mutation (/api/alerts/acknowledge)' },
];

export const HealthView: React.FC<HealthViewProps> = ({ data }) => {
  const { mode, systemStatus, accountStatus } = data;
  const [probeResult, setProbeResult] = useState<{
    endpoint: string;
    httpStatus: number;
    body: Record<string, unknown>;
  } | null>(null);
  const [probing, setProbing] = useState<string | null>(null);

  const handleProbe = async (path: string) => {
    setProbing(path);
    try {
      const res = await probeDisabledEndpoint(path);
      setProbeResult({ endpoint: path, httpStatus: res.httpStatus, body: res.body });
    } catch (err) {
      setProbeResult({
        endpoint: path,
        httpStatus: 500,
        body: { error: err instanceof Error ? err.message : String(err) },
      });
    } finally {
      setProbing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                System Health, Heartbeat & Phase 1 Endpoint Lock Diagnostics
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status={systemStatus.overallHealth} />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Monitors EA heartbeat staleness (threshold EA-5 = 30s), Firestore persistence, and verifies that all Phase 1 command and settings mutation routes return HTTP 403.
            </p>
          </div>
          <Freshness timestamp={systemStatus.updatedAt} staleThresholdSec={30} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <span className="text-xs text-slate-400 uppercase">EA Heartbeat Monitor (EA-5 = 30s)</span>
          <div className="flex items-center gap-2">
            <StatusBadge status={systemStatus.eaConnected ? 'HEALTHY' : 'STALE'} />
          </div>
          <p className="text-xs font-mono text-slate-400 tabular-nums">
            Heartbeat Age: {systemStatus.heartbeatAgeSec !== null ? `${systemStatus.heartbeatAgeSec}s` : 'NO SIGNAL'}
          </p>
          <Freshness timestamp={systemStatus.lastTelemetryAt} staleThresholdSec={30} />
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <span className="text-xs text-slate-400 uppercase">Anti-Replay Sequence State</span>
          <div className="text-lg font-mono font-semibold text-slate-100 tabular-nums">
            Seq #{accountStatus.lastSequenceNumber}
          </div>
          <p className="text-xs font-mono text-slate-400">
            Instance: {accountStatus.instanceId ?? 'NONE'}
          </p>
          <Freshness timestamp={accountStatus.updatedAt} staleThresholdSec={30} />
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2">
          <span className="text-xs text-slate-400 uppercase">Firestore Rules Posture</span>
          <div className="flex items-center gap-2">
            <StatusBadge status="DEPLOYED_READ_ONLY" />
          </div>
          <p className="text-xs text-slate-400">
            Browser writes denied on all status, trade, config & audit collections.
          </p>
        </div>
      </div>

      {/* Interactive Phase 1 HTTP 403 Endpoint Verification */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Lock className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Phase 1 Disabled Command & Settings Endpoint Verifier (Stage 2 Acceptance Check)
            </h3>
            <p className="text-xs text-slate-400">
              Click any write endpoint below to send an authenticated POST request and verify that the backend refuses execution with HTTP 403 and logs the attempt.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DISABLED_ENDPOINTS.map((ep) => (
            <div
              key={ep.path}
              className="p-3.5 rounded border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">{ep.label}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">POST {ep.path}</div>
              </div>
              <button
                onClick={() => handleProbe(ep.path)}
                disabled={probing !== null}
                className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shrink-0 cursor-pointer"
              >
                {probing === ep.path ? 'Probing...' : 'Verify HTTP 403'}
              </button>
            </div>
          ))}
        </div>

        {probeResult && (
          <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">POST {probeResult.endpoint}</span>
              <span className="text-amber-400 font-semibold">HTTP {probeResult.httpStatus}</span>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(probeResult.body, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
