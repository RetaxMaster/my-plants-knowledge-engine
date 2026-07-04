import { mkdir, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { type RowDataPacket } from 'mysql2/promise';
import { toSpeciesSlug } from '@retaxmaster/my-plants-species-schema';
import { connectToDb } from './lib/db.js';
import { buildDumpFiles, type StoredBlogpost } from './lib/dump-files.js';

// Dump ONE stored species (record + its blogpost, if any) to ephemeral draft files so the operator can
// make a TARGETED edit and re-`db:insert` it. This is the faithful READ step of a read-modify-write: it
// writes exactly what is stored, so the parts you don't touch survive byte-for-byte (no re-research, no
// accidental rewrites). Three states: no species → error; species but no blogpost → dump only the record;
// species + blogpost → dump both. The DB stays the single source of truth; these drafts are gitignored
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
  const [speciesRows] = await conn.execute<RowDataPacket[]>(
    'SELECT `slug`, `scientific_name`, `record` FROM `species` WHERE `slug` = ? LIMIT 1',
    [slug],
  );
  if (speciesRows.length === 0) {
    await conn.end();
    console.error(`NOT_FOUND: no row for slug "${slug}". Nothing dumped.`);
    process.exit(1);
  }
  const species = speciesRows[0];
  const [blogRows] = await conn.execute<RowDataPacket[]>(
    'SELECT `title_es`, `title_en`, `excerpt_es`, `excerpt_en`, `body_es`, `body_en`, `cover_image_prompt` ' +
      'FROM `blogposts` WHERE `species_slug` = ? LIMIT 1',
    [slug],
  );
  await conn.end();

  const blogpost: StoredBlogpost | null =
    blogRows.length === 0
      ? null
      : {
          titleEs: blogRows[0].title_es,
          titleEn: blogRows[0].title_en,
          excerptEs: blogRows[0].excerpt_es,
          excerptEn: blogRows[0].excerpt_en,
          bodyEs: blogRows[0].body_es,
          bodyEn: blogRows[0].body_en,
          coverImagePrompt: blogRows[0].cover_image_prompt,
        };

  const files = buildDumpFiles(
    { slug: species.slug, record: species.record, blogpost },
    outDir,
  );

  await mkdir(outDir, { recursive: true });
  for (const file of files) await writeFile(file.path, file.content, 'utf8');

  console.log(`✓ Dumped ${species.slug} (${species.scientific_name}) to editable drafts:`);
  for (const file of files) console.log(`  - ${file.path}`);
  if (blogpost) {
    console.log(
      'Edit ONLY what you intend to change, then `validate` (if the record changed) and `db:insert` to overwrite the row.',
    );
  } else {
    console.log(
      `This species has NO blogpost yet. Author ${species.slug}.blogpost.draft.json from scratch ` +
        '(the editorial-writer\'s seven-key JSON), then `db:insert -- --record … --blogpost …`.',
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
