import { parseArgs } from 'node:util';
import { type RowDataPacket } from 'mysql2/promise';
import { toSpeciesSlug } from '@retaxmaster/my-plants-species-schema';
import { connectToDb } from './lib/db.js';

// Fetch ALL stored data (record + its blogpost, if any) for ONE species, by scientific name (slug is
// derived) or explicit slug. This is a data tool, not a verdict: the operator inspects the result and
// decides — critically — whether it is truly the same species (beware subspecies / same-genus siblings
// that share names) before choosing to enrich it or research a new one. Three states: no species →
// NOT_FOUND; species but no blogpost → print the record + a "no blogpost yet" note; species + blogpost →
// print the record + the structured blogpost.
async function main(): Promise<void> {
  const { values } = parseArgs({ options: { name: { type: 'string' }, slug: { type: 'string' } } });
  if (!values.name && !values.slug) {
    console.error('Usage: npm run db:find -- --name "<scientific name>"   (or --slug <slug>)');
    process.exit(2);
  }
  const slug = values.slug ?? toSpeciesSlug(values.name as string);

  const conn = await connectToDb();
  const [speciesRows] = await conn.execute<RowDataPacket[]>(
    'SELECT `slug`, `scientific_name`, `record` FROM `species` WHERE `slug` = ? LIMIT 1',
    [slug],
  );
  if (speciesRows.length === 0) {
    await conn.end();
    console.log(`NOT_FOUND: no row for slug "${slug}".`);
    return;
  }
  const species = speciesRows[0];
  const [blogRows] = await conn.execute<RowDataPacket[]>(
    'SELECT `status`, `title_es`, `title_en`, `excerpt_es`, `excerpt_en`, `body_es`, `body_en`, `cover_image_prompt` ' +
      'FROM `blogposts` WHERE `species_slug` = ? LIMIT 1',
    [slug],
  );
  await conn.end();

  // `record` is JSON (mysql2 may return it parsed or as a string depending on column type).
  const record =
    typeof species.record === 'string' ? JSON.parse(species.record) : species.record;
  console.log(`FOUND: ${species.slug} (${species.scientific_name})`);
  console.log('--- RECORD (JSON) ---');
  console.log(JSON.stringify(record, null, 2));

  if (blogRows.length === 0) {
    console.log('--- BLOGPOST ---');
    console.log('(no blogpost stored yet — author one and db:insert)');
    console.log('--- END ---');
    return;
  }

  const bp = blogRows[0];
  console.log(`--- BLOGPOST (status ${bp.status === 1 ? 'PUBLISHED (1)' : 'DRAFT (0)'}) ---`);
  console.log('# TITLE (ES)');
  console.log(bp.title_es);
  console.log('# TITLE (EN)');
  console.log(bp.title_en ?? '(none)');
  console.log('# EXCERPT (ES)');
  console.log(bp.excerpt_es);
  console.log('# EXCERPT (EN)');
  console.log(bp.excerpt_en ?? '(none)');
  console.log('# COVER IMAGE PROMPT');
  console.log(bp.cover_image_prompt ?? '(none)');
  console.log('# BODY (ES, Markdown)');
  console.log(bp.body_es);
  console.log('# BODY (EN, Markdown)');
  console.log(bp.body_en ?? '(no English body stored)');
  console.log('--- END ---');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
