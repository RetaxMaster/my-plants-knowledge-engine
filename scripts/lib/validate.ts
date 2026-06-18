import { safeParseSpeciesRecord, type SpeciesRecord } from '@retaxmaster/my-plants-species-schema';

export type ValidateResult =
  | { ok: true; record: SpeciesRecord }
  | { ok: false; issues: string[] };

export function validateRecord(data: unknown): ValidateResult {
  const result = safeParseSpeciesRecord(data);
  if (result.success) {
    return { ok: true, record: result.data };
  }
  const issues = result.error.issues.map(
    (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  return { ok: false, issues };
}
