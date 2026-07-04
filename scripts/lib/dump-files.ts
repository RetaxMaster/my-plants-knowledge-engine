import { join } from 'node:path';

// Pure transform: turn ONE stored species (record + its optional blogpost) into the exact draft files a
// curator edits. Keeping it pure (no DB, no fs) makes the read step of a targeted edit unit-testable and
// guarantees a faithful round-trip: the record re-serialized as pretty JSON, and — when a blogpost exists
// — the blogpost's seven authored fields (incl. coverImagePrompt) as pretty JSON that re-parses straight
// into `db:insert`'s author payload. A species with NO blogpost dumps ONLY the record (never an empty
// blogpost draft that would fail re-insert). Under the same slug-based draft names the rest of the
// onboarding/edit flow already uses.

export interface StoredBlogpost {
  titleEs: string;
  titleEn: string | null;
  excerptEs: string;
  excerptEn: string | null;
  bodyEs: string;
  bodyEn: string | null;
  coverImagePrompt: string | null;
}

export interface StoredSpeciesRow {
  slug: string;
  // mysql2 may hand back the JSON column already parsed (object) or as a raw string.
  record: unknown;
  // null = the species exists but has no blogpost yet (post-0009 gap, or a not-yet-authored new species).
  blogpost: StoredBlogpost | null;
}

export interface DraftFile {
  path: string;
  content: string;
}

export function buildDumpFiles(row: StoredSpeciesRow, outDir = '.'): DraftFile[] {
  const record = typeof row.record === 'string' ? JSON.parse(row.record) : row.record;
  const files: DraftFile[] = [
    { path: join(outDir, `${row.slug}.draft.json`), content: `${JSON.stringify(record, null, 2)}\n` },
  ];

  if (row.blogpost) {
    // Faithful round-trip of the seven authored fields (incl. coverImagePrompt). Nullable fields
    // serialize as JSON `null` (NEVER ""), so the file re-parses into the author payload without
    // tripping the schema's min(1)-when-present rule on re-insert.
    const bp = row.blogpost;
    const payload = {
      titleEs: bp.titleEs,
      titleEn: bp.titleEn ?? null,
      excerptEs: bp.excerptEs,
      excerptEn: bp.excerptEn ?? null,
      bodyEs: bp.bodyEs,
      bodyEn: bp.bodyEn ?? null,
      coverImagePrompt: bp.coverImagePrompt ?? null,
    };
    files.push({
      path: join(outDir, `${row.slug}.blogpost.draft.json`),
      content: `${JSON.stringify(payload, null, 2)}\n`,
    });
  }

  return files;
}
