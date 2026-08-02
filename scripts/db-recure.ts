import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { connectToDb } from '@retaxmaster/my-plants-species-schema/agent-kit/db';
import { toSpeciesSlug } from '@retaxmaster/my-plants-species-schema';
import { validateWritableRecord } from './lib/validate.js';
import { buildRecurePlan } from './lib/recure-plan.js';
import { buildRepotSignRows, writeRepotSigns } from './lib/repot-signs.js';

// RE-CURATION mode (Spec 3 §3.2). Writes the species `record` + its `research_brief` — and, when
// `--repot-signs` is supplied, that species' Spec 5 sign rows — in ONE transaction, and NEVER touches the
// related blogpost row. The owner drives blogpost rewrites himself, afterwards, in production (D20).
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      record: { type: 'string' },
      brief: { type: 'string' },
      'repot-signs': { type: 'string' },
    },
  });
  if (!values.record || !values.brief) {
    console.error(
      'Usage: npm run db:recure -- --record <slug>.draft.json --brief <slug>.brief.md ' +
        '[--repot-signs <slug>.repot-signs.draft.json]',
    );
    process.exit(2);
  }

  let draft: unknown;
  try {
    draft = JSON.parse(await readFile(values.record, 'utf8'));
  } catch (err) {
    console.error(`✗ ${values.record} is not valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }

  const validated = validateWritableRecord(draft);
  if (!validated.ok) {
    console.error(`✗ ${values.record} failed validation; not writing:`);
    for (const issue of validated.issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  let brief: string;
  try {
    brief = await readFile(values.brief, 'utf8');
  } catch (err) {
    console.error(`✗ ${values.brief} could not be read: ${(err as Error).message}`);
    process.exit(1);
  }

  // `--repot-signs` is OPTIONAL only for a species whose research produced no species-specific sign.
  // Omitting it writes no rows AND deactivates none — distinct from passing a file containing `[]`, which
  // says "this research concluded there are none" and deactivates the previous ones. `buildRepotSignRows` is
  // `repoteval` Task 31's writer (`scripts/lib/repot-signs.ts`) — the SAME function `db:insert` already
  // calls — never a second implementation.
  let signRows = null as ReturnType<typeof buildRepotSignRows> | null;
  if (values['repot-signs']) {
    let authored: unknown;
    try {
      authored = JSON.parse(await readFile(values['repot-signs'], 'utf8'));
    } catch (err) {
      console.error(`✗ ${values['repot-signs']} is not valid JSON: ${(err as Error).message}`);
      process.exit(1);
    }
    if (!Array.isArray(authored)) {
      console.error(`✗ ${values['repot-signs']} must be a JSON ARRAY of authored signs.`);
      process.exit(1);
    }
    try {
      signRows = buildRepotSignRows(toSpeciesSlug(validated.record.scientificName), authored);
    } catch (err) {
      console.error(`✗ ${(err as Error).message}`);
      process.exit(1);
    }
  }

  let plan;
  try {
    plan = buildRecurePlan({ record: validated.record, draft, brief, signRows: null });
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
  }

  const conn = await connectToDb();
  try {
    await conn.beginTransaction();
    for (const statement of plan.statements) {
      await conn.execute(statement.sql, statement.params);
    }
    if (signRows !== null) await writeRepotSigns(conn, plan.slug, signRows);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }

  console.log(
    `✓ Re-cured ${plan.slug}: species record + research brief` +
      (signRows === null ? ' (no repot-sign file supplied)' : ` + ${signRows.length} repot sign(s)`) +
      ' written. The blogpost row was NOT touched.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
