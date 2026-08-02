import type { SpeciesRecord } from '@retaxmaster/my-plants-species-schema';
import { buildSpeciesRow } from './db-row.js';
import { SPECIES_UPSERT_SQL } from './db-sql.js';

/**
 * The RE-CURATION plan (Spec 3 §3.2).
 *
 * `db:recure` is the mode the one-time, owner-funded re-curation milestone (§6.4) runs. It writes the
 * species `record` and its `research_brief` — and, once Spec 5's sign contract lands, that species'
 * `repot_signs` rows (Task 19) — and it MUST NOT TOUCH THE `blogposts` ROW AT ALL: not its status, not its
 * body, not its images. That is the single most important safety property of this spec, which is why the
 * plan is a pure, inspectable list of statements rather than a sequence of `conn.execute` calls buried in a
 * CLI: a test can then assert what the plan CANNOT contain.
 *
 * The full-insert path's "a PUBLISHED blogpost is forced back to DRAFT for human re-review" behaviour stays
 * in db-insert.ts. db:recure never reaches it.
 */
// Narrowed to what mysql2's `conn.execute` actually binds (its ExecuteValues union), so a PlannedStatement
// can be handed to `conn.execute(statement.sql, statement.params)` without a cast at the call site.
export type SqlParam = string | number | boolean | Date | null;

export interface PlannedStatement {
  sql: string;
  params: SqlParam[];
}

export interface RecurePlanInput {
  record: SpeciesRecord;
  /** The RAW curation payload, for the growthHabitOtherReason audit key buildSpeciesRow preserves. */
  draft: unknown;
  brief: string;
  /** Spec 5's sign rows for this species; null when the research produced no species-specific sign. */
  signRows: unknown[] | null;
}

export interface RecurePlan {
  slug: string;
  statements: PlannedStatement[];
}

export function buildRecurePlan(input: RecurePlanInput): RecurePlan {
  if (input.brief.trim().length === 0) {
    throw new Error(
      'buildRecurePlan: the research brief is empty. A re-curation writes the record AND the brief — ' +
        'writing only the record would leave the agents on the editorial fallback for a species the owner ' +
        'just paid to research.',
    );
  }
  const row = buildSpeciesRow(input.record, input.draft, input.brief);
  return {
    slug: row.slug,
    statements: [
      { sql: SPECIES_UPSERT_SQL, params: [row.slug, row.scientificName, row.recordJson, row.researchBrief] },
    ],
  };
}
