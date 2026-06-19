import { parseArgs } from 'node:util';
import { type RowDataPacket } from 'mysql2/promise';
import { toSpeciesSlug } from '@retaxmaster/my-plants-species-schema';
import { connectToDb } from './lib/db.js';

// Dedupe lookup: given a scientific name (or slug), report whether the species is already
// curated in the DB and, if so, print its record + brief so the operator can hand them to the
// researcher as the baseline to UPDATE/ENRICH. Identity is the deterministic slug.
async function main(): Promise<void> {
  const { values } = parseArgs({ options: { name: { type: 'string' }, slug: { type: 'string' } } });
  if (!values.name && !values.slug) {
    console.error('Usage: npm run db:get -- --name "<scientific name>"   (or --slug <slug>)');
    process.exit(2);
  }
  const slug = values.slug ?? toSpeciesSlug(values.name as string);

  const conn = await connectToDb();
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT `slug`, `scientific_name`, `record`, `brief` FROM `species` WHERE `slug` = ? LIMIT 1',
    [slug],
  );
  await conn.end();

  if (rows.length === 0) {
    console.log(`NOT_FOUND: ${slug} — no curated record yet; proceed with fresh research.`);
    return;
  }

  const row = rows[0];
  // `record` is JSON (mysql2 may return it parsed or as a string depending on column type).
  const record = typeof row.record === 'string' ? JSON.parse(row.record) : row.record;
  console.log(`FOUND: ${row.slug} (${row.scientific_name}) — already curated; enrich it.`);
  console.log('--- RECORD (JSON) ---');
  console.log(JSON.stringify(record, null, 2));
  console.log('--- BRIEF (Markdown) ---');
  console.log(row.brief ?? '(no brief stored)');
  console.log('--- END ---');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
