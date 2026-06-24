import { mkdir, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { type RowDataPacket } from 'mysql2/promise';
import { toSpeciesSlug } from '@retaxmaster/my-plants-species-schema';
import { connectToDb } from './lib/db.js';
import { buildDumpFiles } from './lib/dump-files.js';

// Dump ONE stored species (record + both briefs) to ephemeral draft files so the operator can make
// a TARGETED edit and re-`db:insert` it. This is the faithful READ step of a read-modify-write: it
// writes exactly what is stored, so the parts you don't touch survive byte-for-byte (no re-research,
// no accidental rewrites). The DB stays the single source of truth; these drafts are gitignored
// scratch and must be deleted once the edit is persisted.
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      slug: { type: 'string' },
      'out-dir': { type: 'string' },
    },
  });
  if (!values.name && !values.slug) {
    console.error(
      'Usage: npm run db:dump -- --name "<scientific name>"   (or --slug <slug>) [--out-dir <dir>]',
    );
    process.exit(2);
  }
  const slug = values.slug ?? toSpeciesSlug(values.name as string);
  const outDir = values['out-dir'] ?? '.';

  const conn = await connectToDb();
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT `slug`, `scientific_name`, `record`, `brief_en`, `brief_es` FROM `species` WHERE `slug` = ? LIMIT 1',
    [slug],
  );
  await conn.end();

  if (rows.length === 0) {
    console.error(`NOT_FOUND: no row for slug "${slug}". Nothing dumped.`);
    process.exit(1);
  }

  const row = rows[0];
  const files = buildDumpFiles(
    { slug: row.slug, record: row.record, briefEn: row.brief_en, briefEs: row.brief_es },
    outDir,
  );

  await mkdir(outDir, { recursive: true });
  for (const file of files) await writeFile(file.path, file.content, 'utf8');

  console.log(`✓ Dumped ${row.slug} (${row.scientific_name}) to editable drafts:`);
  for (const file of files) console.log(`  - ${file.path}`);
  console.log(
    'Edit ONLY what you intend to change, then `validate` (if the record changed) and `db:insert` to overwrite the row.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
