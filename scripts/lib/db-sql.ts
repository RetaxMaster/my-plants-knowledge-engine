// The raw upsert statements the engine runs against the API-owned MariaDB, extracted as pure constants
// so the NON-CLOBBERING guarantee is unit-testable without a live DB. Column names are snake_case (the
// DB), matching the Prisma @map names in the API's schema (Spec 1 §5). These run inside ONE transaction
// in db-insert.ts.

// Species upsert — brief columns are GONE post-migration-0009. Idempotent on the slug PK.
export const SPECIES_UPSERT_SQL =
  'INSERT INTO `species` (`slug`, `scientific_name`, `record`) VALUES (?, ?, ?) ' +
  'ON DUPLICATE KEY UPDATE `scientific_name` = VALUES(`scientific_name`), `record` = VALUES(`record`)';

// Blogpost upsert — species-linked (slug === species_slug), created DRAFT (status = 0). CRITICAL
// human-edit safety: the ON DUPLICATE KEY UPDATE clause names ONLY the seven engine-owned text columns
// (the six title/excerpt/body fields PLUS cover_image_prompt — the OG prompt is engine-authored, like
// body, so an enrich refreshes it) plus a bumped updated_at, so re-running db:insert NEVER overwrites a
// human's status/cover-url/cover-key/youtube/cta/published_at. On first insert `status` = the bound
// DRAFT value and `species_slug` is set; on update both are preserved (absent from the update clause).
//
// `updated_at` is DATETIME(3) NOT NULL with NO DB default (Prisma @updatedAt is applied by the ORM, not
// the DB), so a raw INSERT MUST supply it — we set NOW(3) on insert AND bump it on update. `created_at`
// has a DB default, so it is never bound here. NOW(3) is an inline SQL literal (not a bound param), so
// the bindings array is the 10 value columns (was 9 — cover_image_prompt is the new 10th).
export const BLOGPOST_UPSERT_SQL =
  'INSERT INTO `blogposts` ' +
  '(`slug`, `species_slug`, `status`, `title_es`, `title_en`, `excerpt_es`, `excerpt_en`, `body_es`, `body_en`, `cover_image_prompt`, `updated_at`) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3)) ' +
  'ON DUPLICATE KEY UPDATE ' +
  '`title_es` = VALUES(`title_es`), `title_en` = VALUES(`title_en`), ' +
  '`excerpt_es` = VALUES(`excerpt_es`), `excerpt_en` = VALUES(`excerpt_en`), ' +
  '`body_es` = VALUES(`body_es`), `body_en` = VALUES(`body_en`), ' +
  '`cover_image_prompt` = VALUES(`cover_image_prompt`), ' +
  '`updated_at` = NOW(3)';

// D1 — the DRAFT-forcing sibling of BLOGPOST_UPSERT_SQL. Byte-identical statement EXCEPT the
// ON DUPLICATE KEY UPDATE clause ALSO sets `status` = 0 (0 === BlogpostStatus.DRAFT). Emitted ONLY when
// db-insert.ts has detected that the existing row is currently PUBLISHED: an engine edit to already-public
// content must return to DRAFT for human re-review, enforced deterministically in SQL rather than left to
// an operator instruction (the instruction was the thing that got ignored in the 2026-07-08 incident). The
// INSERT half is unchanged, so a FRESH post is unaffected — the update clause only fires on an existing
// row. Everything else the non-clobbering default protects (cover, CTA, published_at, …) is still
// untouched here.
export const BLOGPOST_UPSERT_AS_DRAFT_SQL = BLOGPOST_UPSERT_SQL + ', `status` = 0';

// Pick the blogpost upsert statement for db:insert based on the CURRENT stored status: the DRAFT-forcing
// variant when the existing row is currently PUBLISHED (an edit/enrich must return it to DRAFT), otherwise
// the non-clobbering default (which preserves the human's status; correct for a fresh insert or an
// already-draft re-run). Kept as a pure function so the status → SQL decision is unit-testable without a
// live DB; db-insert.ts supplies the boolean from a single pre-upsert SELECT.
export function selectBlogpostUpsertSql(isCurrentlyPublished: boolean): string {
  return isCurrentlyPublished ? BLOGPOST_UPSERT_AS_DRAFT_SQL : BLOGPOST_UPSERT_SQL;
}
