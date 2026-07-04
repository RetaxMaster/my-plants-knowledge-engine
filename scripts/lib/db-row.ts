import {
  BlogpostStatus,
  blogpostInputSchema,
  toSpeciesSlug,
  type SpeciesRecord,
} from '@retaxmaster/my-plants-species-schema';

// The `species` table row the engine upserts. Post-migration-0009 the brief columns are GONE — the
// human-readable guide now lives in the related `blogposts` row (see buildBlogpostRow), not here.
export interface SpeciesRow {
  slug: string;
  scientificName: string;
  recordJson: string;
}

export function buildSpeciesRow(record: SpeciesRecord): SpeciesRow {
  return {
    slug: toSpeciesSlug(record.scientificName),
    scientificName: record.scientificName,
    recordJson: JSON.stringify(record),
  };
}

// The AUTHORED subset the editorial-writer emits (six keys) — NOT a full BlogpostInput. Spanish leads
// (required, non-empty); English is nullable. Everything else (slug, speciesSlug, status, cover/CTA)
// is derived/owned by the engine or the human, never by the writer.
export interface BlogpostAuthorPayload {
  titleEs: string;
  titleEn: string | null;
  excerptEs: string;
  excerptEn: string | null;
  bodyEs: string;
  bodyEn: string | null;
  coverImagePrompt: string | null;
}

// The `blogposts` table row the engine upserts — only the columns the engine OWNS. status/cover_*/
// youtube_url/cta_*/published_at/created_at/updated_at are human-owned or DB/SQL-managed and never appear
// here (the non-clobbering upsert in db-sql.ts protects them; updated_at is set to NOW(3) in the SQL).
export interface BlogpostRow {
  slug: string;
  speciesSlug: string;
  status: number;
  titleEs: string;
  titleEn: string | null;
  excerptEs: string;
  excerptEn: string | null;
  bodyEs: string;
  bodyEn: string | null;
  coverImagePrompt: string | null;
}

export type BuildBlogpostRowResult =
  | { ok: true; row: BlogpostRow }
  | { ok: false; issues: string[] };

// Assemble THEN validate (order matters — Spec 2 §4). The raw six-field author payload does NOT satisfy
// blogpostInputSchema (which requires `slug`), so we first MERGE the author payload with the fields the
// engine derives — `slug === speciesSlug` from the record, DRAFT status, and null media/CTA (the human
// sets those later in the writing desk) — and only THEN validate the assembled object with the shared
// blogpostInputSchema (the same contract the API uses), so the row can never diverge from the contract.
// Mirrors how validateRecord gates the record before any DB write.
export function buildBlogpostRow(
  record: SpeciesRecord,
  payload: unknown,
): BuildBlogpostRowResult {
  const slug = toSpeciesSlug(record.scientificName);
  const assembled = {
    ...(payload as Record<string, unknown>),
    slug,
    speciesSlug: slug, // species-linked: slug === speciesSlug (preserves /blog/<species-slug> URLs)
    status: BlogpostStatus.DRAFT, // always DRAFT on insert; the human publishes in the writing desk
    coverImageUrl: null,
    coverImageObjectKey: null,
    youtubeUrl: null,
    ctaLink: null,
    ctaLabelEs: null,
    ctaLabelEn: null,
  };

  const parsed = blogpostInputSchema.safeParse(assembled);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    return { ok: false, issues };
  }

  const b = parsed.data;
  return {
    ok: true,
    row: {
      slug: b.slug,
      speciesSlug: b.speciesSlug as string, // derived === slug, never null here
      status: b.status,
      titleEs: b.titleEs,
      titleEn: b.titleEn,
      excerptEs: b.excerptEs,
      excerptEn: b.excerptEn,
      bodyEs: b.bodyEs,
      bodyEn: b.bodyEn,
      coverImagePrompt: b.coverImagePrompt,
    },
  };
}
