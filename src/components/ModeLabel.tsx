import React from 'react';

/**
 * Section 2.3 (Construction Blueprint V1.0):
 * dashboard/src/components/ModeLabel.tsx
 *
 * Explicit DEMO, LIVE, HISTORICAL, SAMPLE, UNVERIFIED, or NOT VERIFIED text
 * label on every trading figure so DEMO and LIVE data are never confused.
 */

export type DataProvenanceMode =
  | 'DEMO'
  | 'LIVE'
  | 'HISTORICAL'
  | 'SAMPLE'
  | 'UNVERIFIED'
  | 'NOT VERIFIED'
  | 'NOT_VERIFIED';

interface ModeLabelProps {
  mode: DataProvenanceMode;
  source?: string;
}

export const ModeLabel: React.FC<ModeLabelProps> = ({ mode, source }) => {
  const normalized = mode.replace(/_/g, ' ');
  let tone = 'text-amber-300';
  if (normalized === 'LIVE') {
    tone = 'text-rose-400';
  } else if (normalized === 'NOT VERIFIED' || normalized === 'UNVERIFIED') {
    tone = 'text-slate-400';
  } else if (normalized === 'HISTORICAL' || normalized === 'SAMPLE') {
    tone = 'text-sky-300';
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums whitespace-nowrap shrink-0">
      <span className={`font-semibold ${tone}`}>MODE: {normalized}</span>
      {source && (
        <>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-400">SRC: {source}</span>
        </>
      )}
    </span>
  );
};
