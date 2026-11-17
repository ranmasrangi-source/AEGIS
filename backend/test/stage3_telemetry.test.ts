import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { processIncomingTelemetry } from '../src/telemetry/receive.ts';
import {
  buildCanonicalSigningPreimage,
  computePayloadSha256Hex,
  signPreimageWithScheme,
  type KeyRegistryEntry,
} from '../src/crypto/verify.ts';
import { AegisFirestoreRepository } from '../src/firestore/repo.ts';
import { loadRuntimeEnv, type BackendEnvConfig } from '../src/config/env.ts';
import { buildDefaultKeyRegistry } from '../src/index.ts';

function buildSignedTestPacket(
  config: BackendEnvConfig,
  overrides: {
    keyId?: string;
    instanceId?: string;
    mode?: string;
    sequence?: number;
    issuedAtMs?: number;
    expiresAtMs?: number;
    messageId?: string;
    signature?: string;
    bid?: number;
    ask?: number;
    symbol?: string;
    accountMode?: 'DEMO' | 'LIVE';
  } = {},
  nowMs = Date.now()
) {
  const payload = {
    accountMode: overrides.accountMode ?? ('DEMO' as const),
    accountMarginMode: 'HEDGING' as const,
    brokerName: 'Exness Technologies Ltd',
    serverName: 'Exness-MT5Trial7',
    symbol: overrides.symbol ?? config.EXNESS_TARGET_SYMBOL,
    symbolMatched: (overrides.symbol ?? config.EXNESS_TARGET_SYMBOL) === config.EXNESS_TARGET_SYMBOL,
    symbolSpecs: {
      digits: 2,
      point: 0.01,
      tickSize: 0.01,
      tickValue: 1.0,
      contractSize: 100,
      volumeMin: 0.01,
      volumeMax: 200.0,
      volumeStep: 0.01,
      stopsLevel: 0,
      freezeLevel: 0,
      spreadPoints: 16,
    },
    quotes: {
      bid: overrides.bid ?? 2680.1,
      ask: overrides.ask ?? 2680.26,
      quoteTimestamp: new Date(nowMs).toISOString(),
    },
    barsStatus: {
      m15: { ready: true, barCount: 500, lastClosedBarTime: new Date(nowMs - 900_000).toISOString(), stale: false },
      m5: { ready: true, barCount: 500, lastClosedBarTime: new Date(nowMs - 300_000).toISOString(), stale: false },
      m1: { ready: true, barCount: 500, lastClosedBarTime: new Date(nowMs - 60_000).toISOString(), stale: false },
    },
    clockStatus: 'SYNCHRONIZED' as const,
    eaState: 'RECONCILED' as const,
    riskSnapshot: {
      realizedDailyLossPct: 0.0,
      floatingOpenLossPct: 0.0,
      realizedWeeklyLossPct: 0.0,
      consecutiveLosses: 0,
      pauseExpiresAt: null,
      openPositionsCount: 0,
      accountingPolicyStatus: 'UNRESOLVED_FAIL_CLOSED' as const,
      supervisorState: 'REFUSING_CLASS_N_PHASE_1' as const,
    },
  };

  const rawPayloadJson = JSON.stringify(payload);
  const payloadHash = computePayloadSha256Hex(rawPayloadJson);

  const unsignedEnvelope = {
    keyId: overrides.keyId ?? config.EA_ACTIVE_KEY_ID,
    instanceId: overrides.instanceId ?? config.EA_REGISTERED_INSTANCE_ID,
    mode: overrides.mode ?? 'demo',
    sequence: overrides.sequence ?? 1,
    issuedAtMs: overrides.issuedAtMs ?? nowMs,
    expiresAtMs: overrides.expiresAtMs ?? nowMs + 15_000,
    nonce: `nonce_${nowMs}_${Math.random().toString(36).slice(2, 8)}`,
    messageId: overrides.messageId ?? `msg_${nowMs}_${Math.random().toString(36).slice(2, 8)}`,
    payloadHash,
  };

  const preimage = buildCanonicalSigningPreimage(unsignedEnvelope);
  const signature =
    overrides.signature ??
    signPreimageWithScheme(
      preimage,
      config.TELEMETRY_SIGNING_SCHEME,
      config.EA_VERIFICATION_KEY_MATERIAL
    );

  return {
    envelope: {
      ...unsignedEnvelope,
      signature,
    },
    rawPayloadJson,
  };
}

describe('Stage 3 Signed EA Telemetry Receiver & Anti-Replay Verification Suite', () => {
  let repo: AegisFirestoreRepository;
  let config: BackendEnvConfig;
  let keyRegistry: Map<string, KeyRegistryEntry>;

  beforeEach(() => {
    repo = new AegisFirestoreRepository();
    config = loadRuntimeEnv();
    keyRegistry = buildDefaultKeyRegistry(config);
  });

  it('1. accepts a valid signed DEMO telemetry packet and stores snapshot in repo.ts', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { sequence: 1 }, nowMs);
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, true);
    assert.equal(res.statusCode, 200);
    assert.equal(res.reason, 'TELEMETRY_ACCEPTED');
    assert.equal(repo.getLastSequence(config.EA_REGISTERED_INSTANCE_ID, 'demo'), 1);
  });

  it('2. rejects a bad signature with HTTP 401 REJECTED_BAD_SIGNATURE', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { signature: '0'.repeat(64) }, nowMs);
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.reason, 'REJECTED_BAD_SIGNATURE');
  });

  it('3. rejects an unknown key ID with HTTP 401 REJECTED_UNKNOWN_KEY_ID', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { keyId: 'KEY_UNKNOWN_999' }, nowMs);
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.reason, 'REJECTED_UNKNOWN_KEY_ID');
  });

  it('4. rejects a revoked key ID with HTTP 401 REJECTED_REVOKED_KEY_ID', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { keyId: 'KEY_REVOKED_OLD_2025' }, nowMs);
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.reason, 'REJECTED_REVOKED_KEY_ID');
  });

  it('5. rejects a mismatched instance ID with HTTP 401 REJECTED_KEY_INSTANCE_MISMATCH', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { instanceId: 'WRONG_EA_INSTANCE' }, nowMs);
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.reason, 'REJECTED_KEY_INSTANCE_MISMATCH');
  });

  it('6. rejects LIVE mode telemetry in Phase 1 with HTTP 403 REJECTED_LIVE_MODE_FORBIDDEN_IN_PHASE_1', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { mode: 'live', accountMode: 'LIVE' }, nowMs);
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.reason, 'REJECTED_LIVE_MODE_FORBIDDEN_IN_PHASE_1');
  });

  it('7. rejects an expired telemetry packet with HTTP 400 REJECTED_EXPIRED_MESSAGE', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(
      config,
      { issuedAtMs: nowMs - 20_000, expiresAtMs: nowMs - 5_000 },
      nowMs
    );
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.reason, 'REJECTED_EXPIRED_MESSAGE');
  });

  it('8. rejects a timestamp outside tolerance (OS-7) with HTTP 400 REJECTED_TIMESTAMP_OUTSIDE_TOLERANCE', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(
      config,
      { issuedAtMs: nowMs + 120_000, expiresAtMs: nowMs + 150_000 },
      nowMs
    );
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.reason, 'REJECTED_TIMESTAMP_OUTSIDE_TOLERANCE');
  });

  it('9. rejects a replayed messageId with HTTP 409 REJECTED_REPLAYED_MESSAGE_ID', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { messageId: 'msg-replay-001', sequence: 1 }, nowMs);
    const first = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(first.accepted, true);

    const replay = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs + 10);
    assert.equal(replay.accepted, false);
    assert.equal(replay.statusCode, 409);
    assert.equal(replay.reason, 'REJECTED_REPLAYED_MESSAGE_ID');
  });

  it('10. rejects a non-increasing sequence number with HTTP 409 REJECTED_NON_INCREASING_SEQUENCE', () => {
    const nowMs = Date.now();
    const p1 = buildSignedTestPacket(config, { sequence: 5 }, nowMs);
    assert.equal(processIncomingTelemetry(p1, config, repo, keyRegistry, nowMs).accepted, true);

    const p2 = buildSignedTestPacket(config, { sequence: 5 }, nowMs + 50);
    const res2 = processIncomingTelemetry(p2, config, repo, keyRegistry, nowMs + 50);
    assert.equal(res2.accepted, false);
    assert.equal(res2.statusCode, 409);
    assert.equal(res2.reason, 'REJECTED_NON_INCREASING_SEQUENCE');
  });

  it('11. rejects invalid price where ask < bid with HTTP 422', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { bid: 2685.0, ask: 2684.0 }, nowMs);
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 422);
  });

  it('12. rejects symbol mismatch with HTTP 422', () => {
    const nowMs = Date.now();
    const packet = buildSignedTestPacket(config, { symbol: 'EURUSDm' }, nowMs);
    const res = processIncomingTelemetry(packet, config, repo, keyRegistry, nowMs);
    assert.equal(res.accepted, false);
    assert.equal(res.statusCode, 422);
  });
});
