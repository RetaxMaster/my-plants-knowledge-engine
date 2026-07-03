// The raw upsert statements the engine runs against the API-owned MariaDB, extracted as pure constants
// so the NON-CLOBBERING guarantee is unit-testable without a live DB. Column names are snake_case (the
// DB), matching the Prisma @map names in the API's schema (Spec 1 §5). These run inside ONE transaction
// in db-insert.ts.

// Species upsert — brief columns are GONE post-migration-0009. Idempotent on the slug PK.
export const SPECIES_UPSERT_SQL =
  'INSERT INTO `species` (`slug`, `scientific_name`, `record`) VALUES (?, ?, ?) ' +
  'ON DUPLICATE KEY UPDATE `scientific_name` = VALUES(`scientific_name`), `record` = VALUES(`record`)';

// Blogpost upsert — species-linked (slug === species_slug), created DRAFT (status = 0). CRITICAL
// human-edit safety: the ON DUPLICATE KEY UPDATE clause names ONLY the six engine-owned text columns
// (plus a bumped updated_at), so re-running db:insert to enrich a guide NEVER overwrites a human's
// status/cover/youtube/cta/published_at. On first insert `status` = the bound DRAFT value and
// `species_slug` is set; on update both are preserved (absent from the update clause).
//
// `updated_at` is DATETIME(3) NOT NULL with NO DB default (Prisma @updatedAt is applied by the ORM, not
// the DB), so a raw INSERT MUST supply it — we set NOW(3) on insert AND bump it on update (an enrich is
// a change). `created_at` has a DB default (@default(now())), so it is never bound here. NOW(3) is an
// inline SQL literal (not a bound param), so the bindings array stays the 9 value columns.
export const BLOGPOST_UPSERT_SQL =
  'INSERT INTO `blogposts` ' +
  '(`slug`, `species_slug`, `status`, `title_es`, `title_en`, `excerpt_es`, `excerpt_en`, `body_es`, `body_en`, `updated_at`) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3)) ' +
  'ON DUPLICATE KEY UPDATE ' +
  '`title_es` = VALUES(`title_es`), `title_en` = VALUES(`title_en`), ' +
  '`excerpt_es` = VALUES(`excerpt_es`), `excerpt_en` = VALUES(`excerpt_en`), ' +
  '`body_es` = VALUES(`body_es`), `body_en` = VALUES(`body_en`), ' +
  '`updated_at` = NOW(3)';
