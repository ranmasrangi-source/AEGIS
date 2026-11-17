import React, { useState } from 'react';
import { StatusResponse, triggerTelemetryTestHarness, TelemetryHarnessScenario } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';
import { Terminal, Play } from 'lucide-react';

interface ConnectionViewProps {
  data: StatusResponse;
  onRefresh: () => void;
}

const HARNESS_SCENARIOS: Array<{
  id: TelemetryHarnessScenario;
  label: string;
  expectedOutcome: string;
  description: string;
}> = [
  {
    id: 'VALID_DEMO',
    label: 'Send Valid Signed DEMO Telemetry Packet',
    expectedOutcome: 'HTTP 200 (ACCEPTED)',
    description: 'Signs a canonical XAUUSD DEMO telemetry payload with keyId ea-demo-key-01 and monotonically increasing sequence number.',
  },
  {
    id: 'FORGED_SIGNATURE',
    label: 'Test Forged Signature Rejection',
    expectedOutcome: 'HTTP 401 (SIGNATURE_INVALID)',
    description: 'Submits a tampered signature to verify step 4 cryptographic rejection and audit logging.',
  },
  {
    id: 'REPLAY_MESSAGE',
    label: 'Test Duplicate Message ID Replay Rejection',
    expectedOutcome: 'HTTP 409 (REPLAY_MESSAGE_ID)',
    description: 'Sends the exact same messageId twice to verify step 7 anti-replay rejection.',
  },
  {
    id: 'NON_INCREASING_SEQ',
    label: 'Test Non-Increasing Sequence Number Rejection',
    expectedOutcome: 'HTTP 409 (NON_INCREASING_SEQUENCE)',
    description: 'Submits a sequence number <= last accepted sequence number for the EA instance.',
  },
  {
    id: 'EXPIRED_PACKET',
    label: 'Test Expired Telemetry Packet',
    expectedOutcome: 'HTTP 422 (MESSAGE_EXPIRED)',
    description: 'Submits a packet where expiresAtEpochSec is in the past.',
  },
  {
    id: 'FUTURE_TIMESTAMP',
    label: 'Test Clock Skew Beyond Tolerance (OS-7)',
    expectedOutcome: 'HTTP 422 (CLOCK_SKEW_EXCEEDED)',
    description: 'Submits a packet with timestampEpochSec > 30 seconds in the future.',
  },
  {
    id: 'UNKNOWN_KEY',
    label: 'Test Unknown Key ID Rejection',
    expectedOutcome: 'HTTP 401 (UNKNOWN_KEY_ID)',
    description: 'Submits a telemetry packet referencing an unregistered keyId.',
  },
  {
    id: 'REVOKED_KEY',
    label: 'Test Revoked Key ID Rejection',
    expectedOutcome: 'HTTP 401 (REVOKED_KEY_ID)',
    description: 'Submits a telemetry packet signed with revoked keyId ea-revoked-key-00.',
  },
  {
    id: 'INVALID_SPREAD_ASK_LT_BID',
    label: 'Test Invalid Quote (ask < bid)',
    expectedOutcome: 'HTTP 400 (SCHEMA_VALIDATION_FAILED)',
    description: 'Submits ask < bid to verify strict numerical invariant rejection.',
  },
  {
    id: 'SYMBOL_MISMATCH',
    label: 'Test Symbol Mismatch (EURUSD)',
    expectedOutcome: 'HTTP 400 (SCHEMA_VALIDATION_FAILED)',
    description: 'Submits EURUSD to verify XAUUSD symbol enforcement.',
  },
  {
    id: 'LIVE_MODE_FORBIDDEN',
    label: 'Test LIVE Mode Telemetry Refusal in Phase 1',
    expectedOutcome: 'HTTP 400 (SCHEMA_VALIDATION_FAILED)',
    description: 'Submits accountMode=LIVE while LIVE_TRADING_ENABLED=false to verify Phase 1 LIVE lock.',
  },
];

export const ConnectionView: React.FC<ConnectionViewProps> = ({ data, onRefresh }) => {
  const { mode, accountStatus, marketSummary } = data;
  const [runningScenario, setRunningScenario] = useState<TelemetryHarnessScenario | null>(null);
  const [harnessResult, setHarnessResult] = useState<{
    scenario: TelemetryHarnessScenario;
    httpStatus: number;
    body: Record<string, unknown>;
  } | null>(null);

  const handleRunScenario = async (scenario: TelemetryHarnessScenario) => {
    setRunningScenario(scenario);
    try {
      const res = await triggerTelemetryTestHarness(scenario);
      setHarnessResult({
        scenario,
        httpStatus: res.httpStatus,
        body: res.body,
      });
      onRefresh();
    } catch (err) {
      setHarnessResult({
        scenario,
        httpStatus: 500,
        body: { error: err instanceof Error ? err.message : String(err) },
      });
    } finally {
      setRunningScenario(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                EA & Exness Broker Connection Status
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status={accountStatus.verified ? 'CONNECTED' : 'NOT VERIFIED'} />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Displays verified MT5 account, terminal, and symbol specifications for {mode} mode. Account mode is determined exclusively from MT5 EA account properties, never from a manual UI toggle.
            </p>
          </div>
          <Freshness timestamp={accountStatus.updatedAt} staleThresholdSec={30} />
        </div>
      </div>

      {/* Broker & Symbol Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">Broker & Terminal Properties</h3>
            <ModeLabel mode={mode} />
          </div>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Verification Status</span>
              <StatusBadge status={accountStatus.verified ? 'VERIFIED' : 'NOT VERIFIED'} />
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Broker Company</span>
              <span className="text-slate-200">{accountStatus.brokerName ?? 'NOT VERIFIED'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Server Name</span>
              <span className="text-slate-200">{accountStatus.serverName ?? 'NOT VERIFIED'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">EA Instance ID</span>
              <span className="text-slate-200">{accountStatus.instanceId ?? 'NOT VERIFIED'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Terminal Connected</span>
              <span className="text-slate-200">
                {accountStatus.terminalConnected === null
                  ? 'NOT VERIFIED'
                  : accountStatus.terminalConnected
                    ? 'TRUE'
                    : 'FALSE'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Last Accepted Sequence #</span>
              <span className="text-slate-200 tabular-nums">{accountStatus.lastSequenceNumber}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">XAUUSD Contract & Margin Specifications</h3>
            <ModeLabel mode={mode} />
          </div>
          <div className="space-y-2.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Broker Symbol</span>
              <span className="text-slate-200">{marketSummary.symbol}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Digits / Point</span>
              <span className="text-slate-200">
                {accountStatus.digits ?? '—'} / {accountStatus.point ?? '—'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Tick Size / Tick Value</span>
              <span className="text-slate-200">
                {accountStatus.tickSize ?? '—'} / {accountStatus.tickValue ?? '—'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Contract Size</span>
              <span className="text-slate-200">{accountStatus.contractSize ?? '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Min / Max / Step Volume</span>
              <span className="text-slate-200">
                {accountStatus.minVolume ?? '—'} / {accountStatus.maxVolume ?? '—'} / {accountStatus.volumeStep ?? '—'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Stops Level / Freeze Level</span>
              <span className="text-slate-200">
                {accountStatus.stopsLevel ?? '—'} / {accountStatus.freezeLevel ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stage 3 Interactive Signed Telemetry Verification Harness */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Stage 3 Signed EA Telemetry & Anti-Replay Verification Harness
              </h3>
              <p className="text-xs text-slate-400">
                Execute live cryptographic telemetry tests against <code className="text-slate-200">/api/telemetry/receive</code> (Section 8.5 8-step verification order) and inspect the server response and audit log.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-400">Scheme: HMAC_SHA256 (OS-11)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {HARNESS_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">{sc.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{sc.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400">{sc.expectedOutcome}</span>
                <button
                  onClick={() => handleRunScenario(sc.id)}
                  disabled={runningScenario !== null}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  {runningScenario === sc.id ? 'Running...' : 'Execute'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {harnessResult && (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                Scenario: <strong className="text-amber-300">{harnessResult.scenario}</strong>
              </span>
              <span
                className={
                  harnessResult.httpStatus === 200 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                }
              >
                HTTP {harnessResult.httpStatus}
              </span>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(harnessResult.body, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
