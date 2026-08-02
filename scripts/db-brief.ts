import { parseArgs } from 'node:util';
import { type RowDataPacket } from 'mysql2/promise';
import { toSpeciesSlug } from '@retaxmaster/my-plants-species-schema';
import { connectToDb } from '@retaxmaster/my-plants-species-schema/agent-kit/db';

// Read ONE species' saved research brief (Spec 3 §3.3). This is the tool that makes a blogpost REWRITE
// cheap: the operator loads the saved brief and hands it to the editorial_writer WITHOUT re-running the
// research phase. Read-only, like db:list / db:find / db:dump.
async function main(): Promise<void> {
  const { values } = parseArgs({ options: { name: { type: 'string' }, slug: { type: 'string' } } });
  if (!values.name && !values.slug) {
    console.error('Usage: npm run db:brief -- --name "<scientific name>"   (or --slug <slug>)');
    process.exit(2);
  }
  const slug = values.slug ?? toSpeciesSlug(values.name as string);

  const conn = await connectToDb();
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT `slug`, `scientific_name`, `research_brief`, `research_brief_updated_at` ' +
      'FROM `species` WHERE `slug` = ? LIMIT 1',
    [slug],
  );
  await conn.end();

  if (rows.length === 0) {
    console.log(`NOT_FOUND: no species row for slug "${slug}".`);
    return;
  }
  const row = rows[0];
  if (row.research_brief == null) {
    // The transitional state the system genuinely lives in between deploy and the one-time re-curation.
    // Reported honestly so the operator offers a full run rather than silently rewriting from prose.
    console.log(`NO_BRIEF: ${row.slug} (${row.scientific_name}) has no saved brief yet.`);
    console.log('A species with no brief cannot be rewritten cheaply — offer the owner a full research run.');
    return;
  }
  console.log(`FOUND: ${row.slug} (${row.scientific_name})`);
  console.log(`--- BRIEF (updated ${row.research_brief_updated_at ?? 'unknown'}) ---`);
  console.log(String(row.research_brief));
  console.log('--- END ---');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
