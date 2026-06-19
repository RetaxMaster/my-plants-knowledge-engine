import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { buildSpeciesRow } from './lib/db-row.js';
import { validateRecord } from './lib/validate.js';
import { connectToDb } from './lib/db.js';

// Persist ONE curated species into the API-owned `species` table. Reads the ephemeral draft
// record + brief (never a committed file store — the DB is the single source of truth) and
// upserts both. This is the ONLY way curated knowledge enters the DB.
async function main(): Promise<void> {
  const { values } = parseArgs({ options: { record: { type: 'string' }, brief: { type: 'string' } } });
  if (!values.record || !values.brief) {
    console.error('Usage: npm run db:insert -- --record <draft.json> --brief <draft.md>');
    process.exit(2);
  }

  let draft: unknown;
  try {
    draft = JSON.parse(await readFile(values.record, 'utf8'));
  } catch (err) {
    console.error(`✗ ${values.record} is not valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }

  const validated = validateRecord(draft); // re-validate before touching the DB
  if (!validated.ok) {
    console.error(`✗ ${values.record} failed validation; not inserting:`);
    for (const issue of validated.issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  const brief = (await readFile(values.brief, 'utf8')).trim();
  if (brief.length === 0) {
    console.error(`✗ ${values.brief} is empty; the brief must be non-empty Markdown.`);
    process.exit(1);
  }

  const row = buildSpeciesRow(validated.record, brief);
  const conn = await connectToDb();
  // Idempotent upsert (slug PK, snake_case columns). Re-running enriches the existing row.
  await conn.execute(
    'INSERT INTO `species` (`slug`, `scientific_name`, `record`, `brief`) VALUES (?, ?, ?, ?) ' +
      'ON DUPLICATE KEY UPDATE `scientific_name` = VALUES(`scientific_name`), ' +
      '`record` = VALUES(`record`), `brief` = VALUES(`brief`)',
    [row.slug, row.scientificName, row.recordJson, row.brief],
  );
  await conn.end();
  console.log(`✓ Upserted ${row.slug} (record + brief) into the DB.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
