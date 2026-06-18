import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createConnection } from 'mysql2/promise';
import { buildSpeciesRow } from './lib/db-row.js';
import { validateRecord } from './lib/validate.js';

const SPECIES_ROOT = process.env.SPECIES_ROOT ?? 'species';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}. Copy .env.example to .env and export it.`);
    process.exit(2);
  }
  return v;
}

async function main(): Promise<void> {
  const root = path.resolve(SPECIES_ROOT);
  const slugs = (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  if (slugs.length === 0) {
    console.error(`No species found under ${root}. Run the research workflow (save) first.`);
    process.exit(1);
  }

  const conn = await createConnection({
    host: requireEnv('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: requireEnv('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: requireEnv('DB_NAME'),
  });

  let count = 0;
  for (const slug of slugs) {
    const raw = await readFile(path.join(root, slug, 'record.json'), 'utf8');
    const validated = validateRecord(JSON.parse(raw)); // re-validate before touching the DB
    if (!validated.ok) {
      console.error(`✗ ${slug} failed validation; not inserting:`);
      for (const issue of validated.issues) console.error(`  - ${issue}`);
      continue;
    }
    const row = buildSpeciesRow(validated.record);
    // Idempotent upsert into the API-owned `species` table (snake_case plural; slug PK).
    await conn.execute(
      'INSERT INTO `species` (`slug`, `scientificName`, `record`) VALUES (?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE `scientificName` = VALUES(`scientificName`), `record` = VALUES(`record`)',
      [row.slug, row.scientificName, row.recordJson],
    );
    console.log(`✓ Inserted/updated ${row.slug}`);
    count += 1;
  }

  await conn.end();
  console.log(`Done. ${count} species in the DB.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
