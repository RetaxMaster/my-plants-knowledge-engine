import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { connectToDb } from '@retaxmaster/my-plants-species-schema/agent-kit/db';
import { validateRecord } from './lib/validate.js';
import { buildRecurePlan } from './lib/recure-plan.js';

// RE-CURATION mode (Spec 3 §3.2). Writes the species `record` + its `research_brief` — and, when
// `--repot-signs` is supplied, that species' Spec 5 sign rows — in ONE transaction, and NEVER touches the
// related `blogposts` row. The owner drives blogpost rewrites himself, afterwards, in production (D20).
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

  const validated = validateRecord(draft);
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
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }

  console.log(
    `✓ Re-cured ${plan.slug}: species record + research brief written. ` +
      'The blogpost row was NOT touched (status, body and images are unchanged) — verify with ' +
      '`npm run db:find` if you want to see it for yourself.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
