import React from 'react';

/**
 * Section 2.3 (Construction Blueprint V1.0):
 * dashboard/src/components/Freshness.tsx
 *
 * Displays per-field timestamp, age in seconds, and freshness limit check.
 * A fresh heartbeat never masks a stale market or risk field.
 */

interface FreshnessProps {
  timestampIso?: string | null | undefined;
  timestamp?: string | null | undefined;
  maxAgeMs?: number;
  staleThresholdSec?: number;
  label?: string;
}

export const Freshness: React.FC<FreshnessProps> = ({
  timestampIso,
  timestamp,
  maxAgeMs,
  staleThresholdSec = 60,
  label = 'Updated',
}) => {
  const effectiveIso = timestampIso ?? timestamp ?? null;
  const effectiveMaxAgeMs = maxAgeMs ?? staleThresholdSec * 1000;

  if (!effectiveIso) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap shrink-0">
        <span>{label}: NONE</span>
        <span className="text-slate-600" aria-hidden="true">
          ·
        </span>
        <span className="text-amber-400">FRESHNESS: NOT VERIFIED</span>
      </span>
    );
  }

  const parsedMs = Date.parse(effectiveIso);
  if (Number.isNaN(parsedMs)) {
    return (
      <span className="font-mono text-xs text-rose-400 tabular-nums whitespace-nowrap shrink-0">
        {label}: INVALID TIMESTAMP
      </span>
    );
  }

  const ageMs = Math.max(0, Date.now() - parsedMs);
  const ageSec = Math.floor(ageMs / 1000);
  const isFresh = ageMs <= effectiveMaxAgeMs;

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums whitespace-nowrap shrink-0">
      <span className="text-slate-400">
        {label}: {effectiveIso.slice(11, 19)} UTC
      </span>
      <span className="text-slate-600" aria-hidden="true">
        ·
      </span>
      <span className="text-slate-300">Age: {ageSec}s</span>
      <span className="text-slate-600" aria-hidden="true">
        ·
      </span>
      <span className={isFresh ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
        {isFresh ? 'FRESH' : `STALE (> ${Math.floor(effectiveMaxAgeMs / 1000)}s)`}
      </span>
    </span>
  );
};
