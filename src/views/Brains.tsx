import React from 'react';
import { BrainStatusRecord, TradingMode } from '../lib/api.ts';
import { StatusBadge } from '../components/Status.tsx';
import { ModeLabel } from '../components/ModeLabel.tsx';
import { Freshness } from '../components/Freshness.tsx';

interface BrainsViewProps {
  brains: BrainStatusRecord[];
  mode: TradingMode;
}

export const BrainsView: React.FC<BrainsViewProps> = ({ brains, mode }) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-100">
                12-Brain Intelligence Architecture (Authoritative Taxonomy)
              </h2>
              <ModeLabel mode={mode} />
              <StatusBadge status="NOT IMPLEMENTED" />
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Per Construction Blueprint V1.0 Section 1.3 & Section 5, all 12 Brains are displayed below with their exact scope, required inputs, dependencies, and failure rules. In Phase 1, no Brain fabricates scores, signals, or fake AI outputs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brains.map((brain) => (
          <div
            key={brain.brainId}
            className="bg-[#111827] border border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-amber-400 font-semibold">
                    BRAIN {brain.brainId} · {brain.phaseTarget.toUpperCase()}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{brain.name}</h3>
                </div>
                <StatusBadge status={brain.status} />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{brain.purpose}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Required Inputs
                  </span>
                  <ul className="space-y-0.5 text-slate-300 font-mono text-[11px]">
                    {brain.requiredInputs.map((inp, idx) => (
                      <li key={idx}>• {inp}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Dependencies & Failure Rule
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    <span className="text-slate-400">Deps:</span>{' '}
                    {brain.dependencies.length > 0 ? brain.dependencies.join(', ') : 'Independent'}
                  </p>
                  <p className="text-slate-300 text-[11px] mt-1">
                    <span className="text-slate-400">Failure:</span> {brain.failureBehavior}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800/90 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Scope & Limitation: </span>
                {brain.limitations}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-mono text-slate-400">
                State: <span className="text-slate-200">{brain.directionalState}</span> · Score:{' '}
                <span className="text-slate-200">{brain.score ?? 'NULL'}</span> · Conf:{' '}
                <span className="text-slate-200">{brain.confidence ?? 'NULL'}</span>
              </div>
              <Freshness timestamp={brain.updatedAt} staleThresholdSec={60} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
