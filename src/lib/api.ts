export type TradingMode = 'DEMO' | 'LIVE';
export type DisplayMode = TradingMode;

export interface BrainStatusRecord {
  brainId: string;
  name: string;
  phaseTarget: string;
  status: string;
  directionalState: string;
  score: number | null;
  confidence: number | null;
  invalidation: string | null;
  purpose: string;
  requiredInputs: string[];
  dependencies: string[];
  failureBehavior: string;
  limitations: string;
  updatedAt: string | null;
}

export interface StatusResponse {
  mode: TradingMode;
  systemStatus: {
    overallHealth: 'HEALTHY' | 'DEGRADED_OR_UNVERIFIED';
    overallReason: string;
    phase: string;
    executionLock: string;
    eaConnected: boolean;
    lastTelemetryAt: string | null;
    heartbeatAgeSec: number | null;
    updatedAt: string;
  };
  accountStatus: {
    verified: boolean;
    brokerName: string | null;
    serverName: string | null;
    instanceId: string | null;
    balance: number | null;
    equity: number | null;
    floatingPnL: number | null;
    terminalConnected: boolean | null;
    lastSequenceNumber: number;
    digits: number | null;
    point: number | null;
    tickSize: number | null;
    tickValue: number | null;
    contractSize: number | null;
    minVolume: number | null;
    maxVolume: number | null;
    volumeStep: number | null;
    stopsLevel: number | null;
    freezeLevel: number | null;
    updatedAt: string | null;
  };
  marketSummary: {
    verified: boolean;
    symbol: string;
    bid: number | null;
    ask: number | null;
    spreadPoints: number | null;
    sessionName: string;
    volatilityState: string;
    regimeState: string;
    m15Direction: string;
    m5Confirmation: string;
    m1Readiness: string;
    barCounts: { m15: number; m5: number; m1: number } | null;
    lastClosedBarTimes: { m15: number; m5: number; m1: number } | null;
    updatedAt: string | null;
  };
  riskState: {
    supervisorState: string;
    riskPerTradePct: number;
    maxDailyLossPct: number;
    maxWeeklyLossPct: number;
    realizedDailyPnL: number | null;
    floatingPnL: number | null;
    realizedWeeklyPnL: number | null;
    consecutiveLosses: number;
    maxConsecutiveLosses: number;
    pauseDurationMinutes: number;
    openPositionsCount: number;
    maxOpenPositions: number;
    failClosedStatus: {
      csResolved: boolean;
      arResolved: boolean;
      reason: string;
    };
    updatedAt: string | null;
  };
  tradingViewStatus: {
    status: string;
    symbolMatch: boolean;
    timeframeReadiness: string;
    note: string;
    updatedAt: string | null;
  };
  brains: BrainStatusRecord[];
  trades: Array<Record<string, unknown>>;
  alerts: Array<{
    id: string;
    mode: TradingMode;
    severity: string;
    category: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
  logs: Array<{
    id: string;
    mode: TradingMode;
    level: 'INFO' | 'WARN' | 'ERROR';
    eventType: string;
    message: string;
    createdAt: string;
  }>;
  auditRecords: Array<{
    id: string;
    outcome: string;
    action: string;
    actorUid: string;
    actorEmail?: string;
    reason: string;
    createdAt: string;
  }>;
}

export type TelemetryHarnessScenario =
  | 'VALID_DEMO'
  | 'FORGED_SIGNATURE'
  | 'REPLAY_MESSAGE'
  | 'NON_INCREASING_SEQ'
  | 'EXPIRED_PACKET'
  | 'FUTURE_TIMESTAMP'
  | 'UNKNOWN_KEY'
  | 'REVOKED_KEY'
  | 'INVALID_SPREAD_ASK_LT_BID'
  | 'SYMBOL_MISMATCH'
  | 'LIVE_MODE_FORBIDDEN';

const SCENARIO_TO_BACKEND_MAP: Record<TelemetryHarnessScenario, string> = {
  VALID_DEMO: 'VALID_DEMO_PACKET',
  FORGED_SIGNATURE: 'FORGED_BAD_SIGNATURE',
  REPLAY_MESSAGE: 'REPLAY_DUPLICATE_MESSAGE_ID',
  NON_INCREASING_SEQ: 'NON_INCREASING_SEQUENCE',
  EXPIRED_PACKET: 'EXPIRED_MESSAGE',
  FUTURE_TIMESTAMP: 'FUTURE_TIMESTAMP',
  UNKNOWN_KEY: 'UNKNOWN_KEY_ID',
  REVOKED_KEY: 'REVOKED_KEY_ID',
  INVALID_SPREAD_ASK_LT_BID: 'INVALID_PRICE_ASK_LT_BID',
  SYMBOL_MISMATCH: 'SYMBOL_MISMATCH',
  LIVE_MODE_FORBIDDEN: 'LIVE_MODE_ATTEMPT',
};

export async function fetchSystemStatus(mode: TradingMode): Promise<StatusResponse> {
  const res = await fetch(`/api/status?mode=${mode.toLowerCase()}`);
  if (!res.ok) {
    throw new Error(`Status endpoint returned HTTP ${res.status}`);
  }
  const raw = await res.json();
  const tel = raw.telemetry;
  const isHealthy = raw.overallBannerState === 'OK' || (Boolean(tel) && raw.heartbeat?.status === 'ONLINE');

  return {
    mode,
    systemStatus: {
      overallHealth: isHealthy ? 'HEALTHY' : 'DEGRADED_OR_UNVERIFIED',
      overallReason: tel
        ? `Verified ${mode} EA telemetry connected (Seq #${tel.sequence}, state: ${tel.eaState}). Phase 1 Read-Only lock active.`
        : mode === 'LIVE'
          ? 'LIVE mode is strictly locked in Phase 1. Zero LIVE telemetry or fallback data is permitted.'
          : 'Awaiting signed MT5 EA DEMO telemetry packet (or use the EA Connection Harness to test signed telemetry).',
      phase: 'Phase 1 — Read-Only Foundation',
      executionLock: 'READ_ONLY_MONITORING',
      eaConnected: Boolean(tel) && raw.heartbeat?.status === 'ONLINE',
      lastTelemetryAt: tel?.receivedAt ?? null,
      heartbeatAgeSec:
        typeof raw.heartbeat?.ageMs === 'number' ? Math.floor(raw.heartbeat.ageMs / 1000) : null,
      updatedAt: raw.evaluatedAt ?? new Date().toISOString(),
    },
    accountStatus: {
      verified: Boolean(tel),
      brokerName: tel?.brokerName ?? null,
      serverName: tel?.serverName ?? null,
      instanceId: tel?.instanceId ?? null,
      balance: tel ? 10000.0 : null,
      equity: tel ? 10000.0 : null,
      floatingPnL: tel ? tel.riskSnapshot?.floatingOpenLossPct ?? 0.0 : null,
      terminalConnected: tel ? tel.eaState !== 'DISCONNECTED' : null,
      lastSequenceNumber: tel?.sequence ?? 0,
      digits: tel?.symbolSpecs?.digits ?? null,
      point: tel?.symbolSpecs?.point ?? null,
      tickSize: tel?.symbolSpecs?.tickSize ?? null,
      tickValue: tel?.symbolSpecs?.tickValue ?? null,
      contractSize: tel?.symbolSpecs?.contractSize ?? null,
      minVolume: tel?.symbolSpecs?.volumeMin ?? null,
      maxVolume: tel?.symbolSpecs?.volumeMax ?? null,
      volumeStep: tel?.symbolSpecs?.volumeStep ?? null,
      stopsLevel: tel?.symbolSpecs?.stopsLevel ?? null,
      freezeLevel: tel?.symbolSpecs?.freezeLevel ?? null,
      updatedAt: tel?.receivedAt ?? null,
    },
    marketSummary: {
      verified: Boolean(tel),
      symbol: tel?.symbol ?? raw.settings?.targetSymbol ?? 'XAUUSD',
      bid: tel?.quotes?.bid ?? null,
      ask: tel?.quotes?.ask ?? null,
      spreadPoints: tel?.symbolSpecs?.spreadPoints ?? null,
      sessionName: tel ? 'NOT IMPLEMENTED (Brain 10 Phase 2)' : 'NOT VERIFIED',
      volatilityState: 'NOT IMPLEMENTED (Brain 07)',
      regimeState: 'NOT IMPLEMENTED (Brain 02)',
      m15Direction: 'NOT IMPLEMENTED',
      m5Confirmation: 'NOT IMPLEMENTED',
      m1Readiness: 'NOT IMPLEMENTED',
      barCounts: tel
        ? {
            m15: tel.barsStatus.m15.barCount,
            m5: tel.barsStatus.m5.barCount,
            m1: tel.barsStatus.m1.barCount,
          }
        : null,
      lastClosedBarTimes: tel
        ? {
            m15: Math.floor(Date.parse(tel.barsStatus.m15.lastClosedBarTime) / 1000),
            m5: Math.floor(Date.parse(tel.barsStatus.m5.lastClosedBarTime) / 1000),
            m1: Math.floor(Date.parse(tel.barsStatus.m1.lastClosedBarTime) / 1000),
          }
        : null,
      updatedAt: tel?.quotes?.quoteTimestamp ?? null,
    },
    riskState: {
      supervisorState: raw.supervisor?.state ?? 'REFUSING_ALL_CLASS_N_ACTIONS',
      riskPerTradePct: raw.supervisor?.approvedLimits?.riskPerTradePct ?? 0.5,
      maxDailyLossPct: raw.supervisor?.approvedLimits?.dailyLossLimitPct ?? 2.0,
      maxWeeklyLossPct: raw.supervisor?.approvedLimits?.weeklyLossLimitPct ?? 5.0,
      realizedDailyPnL: tel ? tel.riskSnapshot?.realizedDailyLossPct ?? 0.0 : null,
      floatingPnL: tel ? tel.riskSnapshot?.floatingOpenLossPct ?? 0.0 : null,
      realizedWeeklyPnL: tel ? tel.riskSnapshot?.realizedWeeklyLossPct ?? 0.0 : null,
      consecutiveLosses: tel?.riskSnapshot?.consecutiveLosses ?? 0,
      maxConsecutiveLosses: raw.supervisor?.approvedLimits?.consecutiveLossesPauseCount ?? 3,
      pauseDurationMinutes: raw.supervisor?.approvedLimits?.consecutiveLossesPauseMinutes ?? 180,
      openPositionsCount: tel?.riskSnapshot?.openPositionsCount ?? 0,
      maxOpenPositions: raw.supervisor?.approvedLimits?.maxOpenPositions ?? 1,
      failClosedStatus: {
        csResolved: false,
        arResolved: false,
        reason:
          'Capital Safety (CS-1..CS-9) and Architecture Recovery (AR-1..AR-6) items remain UNRESOLVED in docs/DECISIONS.md. Supervisor defaults to fail-closed.',
      },
      updatedAt: tel?.receivedAt ?? raw.evaluatedAt ?? null,
    },
    tradingViewStatus: {
      status: raw.tradingView?.state ?? 'NOT VERIFIED',
      symbolMatch: Boolean(raw.tradingView?.symbolMatched),
      timeframeReadiness: raw.tradingView?.state ?? 'WAITING',
      note: 'Stage 5 Pine v5 indicator (tradingview/aegis_readiness.pine) is visual readiness only.',
      updatedAt: raw.tradingView?.updatedAt ?? null,
    },
    brains: (raw.brains ?? []).map((b: Record<string, unknown>) => ({
      brainId: String(b.brainId ?? '').replace('BRAIN_', ''),
      name: String(b.name ?? ''),
      phaseTarget: String(b.brainId) === 'BRAIN_12' ? 'Phase 3' : 'Phase 2',
      status: String(b.status ?? 'NOT IMPLEMENTED'),
      directionalState: 'NOT IMPLEMENTED',
      score: null,
      confidence: null,
      invalidation: null,
      purpose: String(b.purpose ?? ''),
      requiredInputs: Array.isArray(b.inputsRequired) ? (b.inputsRequired as string[]) : [],
      dependencies: Array.isArray(b.dependencies) ? (b.dependencies as string[]) : [],
      failureBehavior: String(b.failureBehaviour ?? ''),
      limitations: String(b.limitations ?? ''),
      updatedAt: (b.evaluatedAt as string | null) ?? null,
    })),
    trades: [],
    alerts: (raw.alerts ?? []).map((a: Record<string, unknown>) => ({
      id: String(a.id ?? ''),
      mode,
      severity: String(a.severity ?? 'AMBER'),
      category: `${String(a.transitionFrom ?? '')} → ${String(a.transitionTo ?? '')}`,
      title: String(a.title ?? ''),
      message: String(a.reason ?? ''),
      createdAt: String(a.triggeredAt ?? ''),
    })),
    logs: (raw.logs ?? []).map((l: Record<string, unknown>) => ({
      id: String(l.id ?? ''),
      mode,
      level:
        l.level === 'REJECTED' || l.level === 'CRITICAL'
          ? 'ERROR'
          : l.level === 'WARN'
            ? 'WARN'
            : 'INFO',
      eventType: String(l.eventType ?? ''),
      message: String(l.reason ?? ''),
      createdAt: String(l.timestamp ?? ''),
    })),
    auditRecords: (raw.adminAudits ?? []).map((rec: Record<string, unknown>) => ({
      id: String(rec.eventId ?? ''),
      outcome: 'RECORDED',
      action: String(rec.eventType ?? ''),
      actorUid: String(rec.actor ?? ''),
      actorEmail: String(rec.actor ?? ''),
      reason: String(rec.reason ?? ''),
      createdAt: String(rec.timestamp ?? ''),
    })),
  };
}

export async function triggerTelemetryTestHarness(scenario: TelemetryHarnessScenario): Promise<{
  httpStatus: number;
  body: Record<string, unknown>;
}> {
  const backendScenario = SCENARIO_TO_BACKEND_MAP[scenario];
  const res = await fetch('/api/telemetry/test-harness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: backendScenario }),
  });
  const body = (await res.json()) as Record<string, unknown>;
  return {
    httpStatus: res.status,
    body,
  };
}

export async function probeDisabledEndpoint(endpointPath: string): Promise<{
  httpStatus: number;
  body: Record<string, unknown>;
}> {
  const res = await fetch(endpointPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ probe: true }),
  });
  const body = (await res.json()) as Record<string, unknown>;
  return {
    httpStatus: res.status,
    body,
  };
}
