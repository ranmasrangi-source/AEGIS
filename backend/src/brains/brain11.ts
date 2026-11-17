import { getPhase1BrainOutputs, StandardBrainOutput } from './common/output.ts';
import type { TradingMode } from '../firestore/repo.ts';

export function getBrain11Status(mode: TradingMode = 'demo'): StandardBrainOutput {
  return getPhase1BrainOutputs(mode).find((b) => b.brainId === 'BRAIN_11')!;
}
