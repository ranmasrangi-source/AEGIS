import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processIncomingTelemetry } from '../../backend/src/telemetry/receive.ts';
import {
  buildCanonicalSigningPreimage,
  computePayloadSha256Hex,
  signPreimageWithScheme,
} from '../../backend/src/crypto/verify.ts';
import { AegisFirestoreRepository } from '../../backend/src/firestore/repo.ts';
import { loadRuntimeEnv } from '../../backend/src/config/env.ts';
import { buildDefaultKeyRegistry } from '../../backend/src/index.ts';
import { buildReadOnlySystemStatus } from '../../backend/src/api/status.ts';
import { evaluateHeartbeatStatus } from '../../backend/src/monitoring/heartbeat.ts';

describe('Phase 1 End-to-End Integration Suite (Stage 3 -> Repo Isolation -> Stage 4 Status -> Heartbeat Alert)', () => {
  it('maintains strict DEMO vs LIVE data isolation and raises transition-only heartbeat staleness alerts', () => {
    const repo = new AegisFirestoreRepository();
    const config = loadRuntimeEnv();
    const keyRegistry = buildDefaultKeyRegistry(config);
    const nowMs = Date.now();

    const payload = {
      accountMode: 'DEMO' as const,
      accountMarginMode: 'HEDGING' as const,
      brokerName: 'Exness Technologies Ltd',
      serverName: 'Exness-MT5Trial7',
      symbol: config.EXNESS_TARGET_SYMBOL,
      symbolMatched: true,
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
        bid: 2690.5,
        ask: 2690.66,
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
      keyId: config.EA_ACTIVE_KEY_ID,
      instanceId: config.EA_REGISTERED_INSTANCE_ID,
      mode: 'demo',
      sequence: 1,
      issuedAtMs: nowMs,
      expiresAtMs: nowMs + 15_000,
      nonce: 'nonce_integration_01',
      messageId: 'msg_integration_01',
      payloadHash,
    };
    const preimage = buildCanonicalSigningPreimage(unsignedEnvelope);
    const signature = signPreimageWithScheme(
      preimage,
      config.TELEMETRY_SIGNING_SCHEME,
      config.EA_VERIFICATION_KEY_MATERIAL
    );

    const receiveRes = processIncomingTelemetry(
      { envelope: { ...unsignedEnvelope, signature }, rawPayloadJson },
      config,
      repo,
      keyRegistry,
      nowMs
    );
    assert.equal(receiveRes.accepted, true);

    // 1. Verify DEMO status snapshot has the telemetry
    const demoStatus = buildReadOnlySystemStatus(repo, config, 'demo', nowMs);
    assert.ok(demoStatus.telemetry !== null);
    assert.equal(demoStatus.telemetry?.quotes.bid, 2690.5);
    assert.equal(demoStatus.heartbeat.status, 'ONLINE');

    // 2. Verify LIVE status snapshot never falls back to DEMO data and reports NOT_VERIFIED
    const liveStatus = buildReadOnlySystemStatus(repo, config, 'live', nowMs);
    assert.equal(liveStatus.telemetry, null);
    assert.equal(liveStatus.overallBannerState, 'NOT_VERIFIED');
    assert.equal(liveStatus.heartbeat.status, 'NOT_VERIFIED');

    // 3. Verify Heartbeat staleness transition alert fires once when age > EA_HEARTBEAT_MAX_AGE_MS
    const staleEval1 = evaluateHeartbeatStatus(
      repo,
      'demo',
      config.EA_HEARTBEAT_MAX_AGE_MS,
      nowMs + config.EA_HEARTBEAT_MAX_AGE_MS + 5_000
    );
    assert.equal(staleEval1.status, 'STALE');
    assert.equal(staleEval1.alertRaised, true);
    assert.equal(repo.getAlerts('demo').length, 1);

    // Subsequent evaluation while still STALE must NOT raise a duplicate alert
    const staleEval2 = evaluateHeartbeatStatus(
      repo,
      'demo',
      config.EA_HEARTBEAT_MAX_AGE_MS,
      nowMs + config.EA_HEARTBEAT_MAX_AGE_MS + 10_000
    );
    assert.equal(staleEval2.status, 'STALE');
    assert.equal(staleEval2.alertRaised, false);
    assert.equal(repo.getAlerts('demo').length, 1);
  });
});
