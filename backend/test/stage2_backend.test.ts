import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateStrictEnv, loadRuntimeEnv } from '../src/config/env.ts';
import { verifyOwnerToken } from '../src/auth/verifyOwner.ts';
import { buildDisabledEndpointRefusal } from '../src/api/disabled.ts';
import { getPhase1BrainOutputs } from '../src/brains/common/output.ts';
import { getBrain01Status } from '../src/brains/brain01.ts';
import { getBrain12Status } from '../src/brains/brain12.ts';

describe('Stage 2 Backend Skeleton, Auth & Disabled Endpoints Unit Tests', () => {
  it('1. fails startup when required environment variables are missing or invalid', () => {
    assert.throws(() => {
      validateStrictEnv({});
    }, /ENV_VALIDATION_FAILED/);
  });

  it('2. loads runtime environment configuration with explicit OS-11, OS-7, EA-5 defaults', () => {
    const config = loadRuntimeEnv({
      OWNER_EMAIL: 'adventurenepal04@gmail.com',
    });
    assert.equal(config.OWNER_EMAIL, 'adventurenepal04@gmail.com');
    assert.equal(config.TELEMETRY_SIGNING_SCHEME, 'HMAC_SHA256');
    assert.equal(config.TELEMETRY_TIMESTAMP_TOLERANCE_MS, 30000);
  });

  it('3. verifies owner token: rejects missing token, invalid token, unverified email, and non-owner email; accepts verified owner', async () => {
    const ownerConfig = {
      OWNER_UID: 'owner-uid-001',
      OWNER_EMAIL: 'adventurenepal04@gmail.com',
    };

    const missingRes = await verifyOwnerToken(undefined, ownerConfig, async () => ({
      uid: 'owner-uid-001',
    }));
    assert.equal(missingRes.authorized, false);
    assert.equal(missingRes.statusCode, 401);

    const invalidRes = await verifyOwnerToken('Bearer bad-token', ownerConfig, async () => {
      throw new Error('Invalid token');
    });
    assert.equal(invalidRes.authorized, false);
    assert.equal(invalidRes.statusCode, 401);

    const nonOwnerRes = await verifyOwnerToken('Bearer intruder-token', ownerConfig, async () => ({
      uid: 'intruder-999',
      email: 'intruder@example.com',
      email_verified: true,
    }));
    assert.equal(nonOwnerRes.authorized, false);
    assert.equal(nonOwnerRes.statusCode, 403);

    const unverifiedEmailRes = await verifyOwnerToken('Bearer spoof-token', {
      OWNER_UID: 'OWNER_UID_PENDING_REGISTRATION',
      OWNER_EMAIL: 'adventurenepal04@gmail.com',
    }, async () => ({
      uid: 'spoof-999',
      email: 'adventurenepal04@gmail.com',
      email_verified: false,
    }));
    assert.equal(unverifiedEmailRes.authorized, false);
    assert.equal(unverifiedEmailRes.statusCode, 403);

    const validOwnerRes = await verifyOwnerToken('Bearer valid-owner-token', ownerConfig, async () => ({
      uid: 'owner-uid-001',
      email: 'adventurenepal04@gmail.com',
      email_verified: true,
    }));
    assert.equal(validOwnerRes.authorized, true);
    assert.equal(validOwnerRes.statusCode, 200);
  });

  it('4. returns HTTP 403 structured refusal for all disabled Class N, Class R, Class A, and Command endpoints in Phase 1', () => {
    const classN = buildDisabledEndpointRefusal('/api/orders', 'POST', 'CLASS_N_NEW_EXPOSURE');
    assert.equal(classN.httpCode, 403);
    assert.equal(classN.status, 'REFUSED');
    assert.ok(classN.reason.includes('REFUSED_PHASE_1_CLASS_N_DISABLED'));

    const classR = buildDisabledEndpointRefusal('/api/emergency/close-all', 'POST', 'CLASS_R_RISK_REDUCTION');
    assert.equal(classR.httpCode, 403);
    assert.ok(classR.reason.includes('REFUSED_PHASE_1_CLASS_R_DISABLED'));

    const classA = buildDisabledEndpointRefusal('/api/settings', 'POST', 'CLASS_A_SETTINGS');
    assert.equal(classA.httpCode, 403);
    assert.ok(classA.reason.includes('REFUSED_PHASE_1_CLASS_A_DISABLED'));
  });

  it('5. returns all 12 Brains in authoritative order with NOT IMPLEMENTED status and null result', () => {
    const brains = getPhase1BrainOutputs('demo');
    assert.equal(brains.length, 12);
    for (const brain of brains) {
      assert.equal(brain.status, 'NOT IMPLEMENTED');
      assert.equal(brain.result, null);
    }
    assert.equal(getBrain01Status('demo').name, '01 Macro and Fundamental Intelligence');
    assert.equal(getBrain12Status('demo').name, '12 Trade Management Intelligence');
  });
});
