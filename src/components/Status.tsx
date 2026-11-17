import React from 'react';

/**
 * Section 2.3 (Construction Blueprint V1.0):
 * dashboard/src/components/Status.tsx
 *
 * Status representation with explicit label text, never color alone.
 * Follows zero-pill typography discipline (clean text with semantic prefix label).
 */

export type SystemStateKind = string;

interface StatusProps {
  state?: SystemStateKind;
  status?: SystemStateKind;
  prefix?: string;
}

export const Status: React.FC<StatusProps> = ({ state, status, prefix }) => {
  const raw = state ?? status ?? 'NOT VERIFIED';
  const normalized = String(raw).toUpperCase().replace(/_/g, ' ');

  let colorClass = 'text-slate-300';
  let symbolPrefix = '[STATE]';

  if (
    normalized === 'OK' ||
    normalized === 'HEALTHY' ||
    normalized === 'READY' ||
    normalized === 'ONLINE' ||
    normalized === 'CONNECTED' ||
    normalized === 'VERIFIED' ||
    normalized === 'RECONCILED' ||
    normalized === 'SYNCHRONIZED' ||
    normalized === 'APPROVED' ||
    normalized === 'ACCEPTED' ||
    normalized === 'INFO'
  ) {
    colorClass = 'text-emerald-400';
    symbolPrefix = '[NOMINAL]';
  } else if (
    normalized.includes('WAITING') ||
    normalized.includes('AMBER') ||
    normalized.includes('WARN') ||
    normalized.includes('PROPOSED') ||
    normalized === 'STALE' ||
    normalized.includes('READ ONLY') ||
    normalized.includes('DISABLED') ||
    normalized.includes('APPEND ONLY')
  ) {
    colorClass = 'text-amber-400';
    symbolPrefix = '[CAUTION]';
  } else if (
    normalized === 'ERROR' ||
    normalized === 'DISCONNECTED' ||
    normalized.includes('RED') ||
    normalized.includes('REFUSED') ||
    normalized.includes('REJECTED') ||
    normalized.includes('RECONCILE REQUIRED')
  ) {
    colorClass = 'text-rose-400';
    symbolPrefix = '[ALERT]';
  } else if (
    normalized.includes('NOT VERIFIED') ||
    normalized.includes('NOT IMPLEMENTED') ||
    normalized.includes('UNRESOLVED') ||
    normalized.includes('NO STRATEGY') ||
    normalized.includes('NO TRADES')
  ) {
    colorClass = 'text-slate-400';
    symbolPrefix = '[GATED]';
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums whitespace-nowrap shrink-0">
      {prefix && (
        <>
          <span className="text-slate-400">{prefix}</span>
          <span className="text-slate-600" aria-hidden="true">
            /
          </span>
        </>
      )}
      <span className={`font-medium ${colorClass}`}>
        {symbolPrefix} {normalized}
      </span>
    </span>
  );
};

export const StatusBadge = Status;
