import { join } from 'node:path';

// Pure transform: turn ONE stored species row into the exact draft files a curator edits.
// Keeping it pure (no DB, no fs) makes the read step of a targeted edit unit-testable and
// guarantees a faithful round-trip — the record re-serialized as pretty JSON (so `db:insert`
// can parse it), each brief written verbatim (empty string when the column is NULL) — under the
// same slug-based draft names the rest of the onboarding/edit flow already uses.

export interface StoredSpeciesRow {
  slug: string;
  // mysql2 may hand back the JSON column already parsed (object) or as a raw string.
  record: unknown;
  briefEn: string | null;
  briefEs: string | null;
}

export interface DraftFile {
  path: string;
  content: string;
}

export function buildDumpFiles(row: StoredSpeciesRow, outDir = '.'): DraftFile[] {
  const record = typeof row.record === 'string' ? JSON.parse(row.record) : row.record;
  return [
    { path: join(outDir, `${row.slug}.draft.json`), content: `${JSON.stringify(record, null, 2)}\n` },
    { path: join(outDir, `${row.slug}.en.draft.md`), content: row.briefEn ?? '' },
    { path: join(outDir, `${row.slug}.es.draft.md`), content: row.briefEs ?? '' },
  ];
}
