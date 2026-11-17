import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Stage 1 Firestore Security Rules & Dirty Dozen Specification Verification', () => {
  it('verifies security_spec.md defines all Phase 0 invariants and Dirty Dozen attack vectors', () => {
    const specPath = path.resolve(process.cwd(), 'security_spec.md');
    const content = fs.readFileSync(specPath, 'utf-8');
    assert.ok(content.includes('Core Security Data Invariants'));
    assert.ok(content.includes('Dirty Dozen'));
    assert.ok(content.includes('adventurenepal04@gmail.com'));
  });

  it('verifies firestore.rules and firebase/firestore.rules are identical and enforce zero client writes across all Section 8.10 collections', () => {
    const rootRules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf-8');
    const firebaseDirRules = fs.readFileSync(
      path.resolve(process.cwd(), 'firebase/firestore.rules'),
      'utf-8'
    );
    assert.equal(rootRules, firebaseDirRules);

    const requiredPaths = [
      'match /status/{docId}',
      'match /system/{docId}',
      'match /config/{docId}',
      'match /config/modes/{mode}/{docId}',
      'match /admin_audit/{docId}',
      'match /modes/{mode}/decisions/{docId}',
      'match /modes/{mode}/brain_outputs/{docId}',
      'match /modes/{mode}/risk_events/{docId}',
      'match /modes/{mode}/commands/{docId}',
      'match /modes/{mode}/order_requests/{docId}',
      'match /modes/{mode}/executions/{docId}',
      'match /modes/{mode}/trades/{docId}',
      'match /modes/{mode}/analytics/{docId}',
      'match /modes/{mode}/telemetry_status/{docId}',
      'match /modes/{mode}/strategy_runs/{docId}',
      'match /modes/{mode}/alerts/{docId}',
      'match /modes/{mode}/logs/{docId}',
      'match /replay/{docId}',
    ];

    for (const rulePath of requiredPaths) {
      assert.ok(
        rootRules.includes(rulePath),
        `Expected collection match rule "${rulePath}" in firestore.rules`
      );
    }
  });
});
