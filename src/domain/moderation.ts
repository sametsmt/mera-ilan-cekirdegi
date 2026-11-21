import type { ModerationResult, Verdict } from './types.js';

const SEVERITY: Record<Verdict, number> = { APPROVED: 0, NEEDS_REVIEW: 1, REJECTED: 2 };

// Zincirin sonucu: birleşik sonuç + çalışan handler'ların sırası.
export interface ModerationReport extends ModerationResult {
  trail: string[];
}

export function worstVerdict(a: Verdict, b: Verdict): Verdict {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

// En kötü verdict + tüm reason'lar (tekrarsız).
export function mergeResults(a: ModerationResult, b: ModerationResult): ModerationResult {
  const merged: ModerationResult = {
    verdict: worstVerdict(a.verdict, b.verdict),
    reasons: [...new Set([...a.reasons, ...b.reasons])],
  };
  const species = a.detectedSpecies ?? b.detectedSpecies;
  if (species !== undefined) merged.detectedSpecies = species;
  return merged;
}
