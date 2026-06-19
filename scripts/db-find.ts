import { parseArgs } from 'node:util';
import { type RowDataPacket } from 'mysql2/promise';
import { toSpeciesSlug } from '@retaxmaster/my-plants-species-schema';
import { connectToDb } from './lib/db.js';

// Fetch ALL stored data (record + brief) for ONE species, by scientific name (slug is derived)
// or explicit slug. This is a data tool, not a verdict: the operator inspects the result and
// decides — critically — whether it is truly the same species (beware subspecies / same-genus
// siblings that share names) before choosing to enrich it or research a new one.
async function main(): Promise<void> {
  const { values } = parseArgs({ options: { name: { type: 'string' }, slug: { type: 'string' } } });
  if (!values.name && !values.slug) {
    console.error('Usage: npm run db:find -- --name "<scientific name>"   (or --slug <slug>)');
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
    console.log(`NOT_FOUND: no row for slug "${slug}".`);
    return;
  }

  const row = rows[0];
  // `record` is JSON (mysql2 may return it parsed or as a string depending on column type).
  const record = typeof row.record === 'string' ? JSON.parse(row.record) : row.record;
  console.log(`FOUND: ${row.slug} (${row.scientific_name})`);
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
