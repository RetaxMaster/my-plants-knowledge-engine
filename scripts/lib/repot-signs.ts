import type { Connection } from 'mysql2/promise';
import {
  UNIVERSAL_REPOT_SIGN_SEMANTIC_SLUGS,
  composeSpeciesRepotSignId,
  repotSignDraftSchema,
  type RepotSignRow,
} from '@retaxmaster/my-plants-species-schema';
import { REPOT_SIGN_UPSERT_SQL } from './db-sql.js';

const UNIVERSAL = new Set(UNIVERSAL_REPOT_SIGN_SEMANTIC_SLUGS);

/**
 * Validate the subagent's drafts and compose the persisted rows.
 *
 * THREE rejections that are all real defects being caught, not nuisances:
 *  - a duplicate of a UNIVERSAL sign would be counted TWICE in the engine's score;
 *  - a blank `labelEs` would ship an English string into a Spanish UI, which is the exact defect this whole
 *    feature closes;
 *  - a malformed or over-long id would break the permanent referent of every past observation.
 */
export function buildRepotSignRows(speciesSlug: string, drafts: unknown[]): RepotSignRow[] {
  const seen = new Set<string>();
  return drafts.map((raw, i) => {
    const parsed = repotSignDraftSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `repot sign #${i + 1}: ${parsed.error.issues.map((x) => `${x.path.join('.') || '(root)'}: ${x.message}`).join('; ')}`,
      );
    }
    const d = parsed.data;
    if (UNIVERSAL.has(d.semanticSlug)) {
      throw new Error(
        `repot sign #${i + 1} ("${d.semanticSlug}") duplicates a UNIVERSAL sign. The app already seeds it, and a duplicate row would be counted twice in the score. Return nothing for it.`,
      );
    }
    if (seen.has(d.semanticSlug)) throw new Error(`duplicate semantic slug in this run: ${d.semanticSlug}`);
    seen.add(d.semanticSlug);
    return {
      id: composeSpeciesRepotSignId(speciesSlug, d.semanticSlug),
      speciesSlug,
      labelEn: d.labelEn,
      labelEs: d.labelEs,
      helpEn: d.helpEn,
      helpEs: d.helpEs,
      evidence: d.evidence,
      active: true,
      sortOrder: d.sortOrder,
    };
  });
}

/**
 * UPSERT by id, then DEACTIVATE every previously-curated row this run omitted. Never DELETE: a past
 * observation's `checked_sign_ids` may reference a retired row, and that row must stay fully readable so
 * history renders — it is simply never offered on a new questionnaire again.
 */
export async function writeRepotSigns(
  conn: Connection,
  speciesSlug: string,
  rows: RepotSignRow[],
): Promise<void> {
  for (const r of rows) {
    await conn.execute(REPOT_SIGN_UPSERT_SQL, [
      r.id, r.speciesSlug, r.labelEn, r.labelEs, r.helpEn, r.helpEs, r.evidence, r.sortOrder,
    ]);
  }
  const keptIds = rows.map((r) => r.id);
  if (keptIds.length === 0) {
    await conn.execute(
      'UPDATE `repot_signs` SET `active` = FALSE WHERE `species_slug` = ?',
      [speciesSlug],
    );
    return;
  }
  await conn.execute(
    `UPDATE \`repot_signs\` SET \`active\` = FALSE WHERE \`species_slug\` = ? AND \`id\` NOT IN (${keptIds.map(() => '?').join(',')})`,
    [speciesSlug, ...keptIds],
  );
}
