import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { buildSpeciesRow, buildBlogpostRow } from './lib/db-row.js';
import { validateRecord } from './lib/validate.js';
import { connectToDb } from './lib/db.js';
import { SPECIES_UPSERT_SQL, BLOGPOST_UPSERT_SQL } from './lib/db-sql.js';
import { parseBlogpostPayload } from './lib/parse-payload.js';

// Persist ONE curated species into the API-owned DB: the `species` record row AND its related
// `blogposts` row, in a single transaction. The blogpost is created DRAFT (status = 0); publishing is a
// human act in the web writing desk, never the engine. Re-running enriches the engine-owned text without
// clobbering the human's status/cover/CTA (the non-clobbering upsert in db-sql.ts). This is the ONLY way
// curated knowledge enters the DB.
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      record: { type: 'string' },
      blogpost: { type: 'string' },
    },
  });
  if (!values.record || !values.blogpost) {
    console.error(
      'Usage: npm run db:insert -- --record <slug>.draft.json --blogpost <slug>.blogpost.draft.json',
    );
    process.exit(2);
  }

  // 1) Parse + re-validate the RECORD (the gate; never hand-edit values to force a pass).
  let draft: unknown;
  try {
    draft = JSON.parse(await readFile(values.record, 'utf8'));
  } catch (err) {
    console.error(`✗ ${values.record} is not valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }
  const validated = validateRecord(draft);
  if (!validated.ok) {
    console.error(`✗ ${values.record} failed validation; not inserting:`);
    for (const issue of validated.issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  // 2) Parse the BLOGPOST author payload (the editorial-writer's six-key JSON). The writer returns it
  //    inside a fenced ```json block and the operator saves that reply VERBATIM, so tolerate an optional
  //    outer code fence here (a plain .json file parses unchanged; inner ``` code fences in the body
  //    Markdown are preserved — see parse-payload.ts).
  let payload: unknown;
  try {
    payload = parseBlogpostPayload(await readFile(values.blogpost, 'utf8'));
  } catch (err) {
    console.error(`✗ ${values.blogpost} is not valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }

  // 3) Assemble THEN validate the blogpost against the shared contract (derives slug/speciesSlug/status,
  //    null media/CTA). ES required non-empty; EN nullable.
  const blogpost = buildBlogpostRow(validated.record, payload);
  if (!blogpost.ok) {
    console.error(`✗ ${values.blogpost} failed the blogpost contract; not inserting:`);
    for (const issue of blogpost.issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  const speciesRow = buildSpeciesRow(validated.record);
  const bp = blogpost.row;

  // 4) Persist BOTH in one transaction on one connection. NOW(3) for updated_at is inline in the SQL,
  //    so the bindings are exactly the 10 value columns.
  const conn = await connectToDb();
  try {
    await conn.beginTransaction();
    await conn.execute(SPECIES_UPSERT_SQL, [
      speciesRow.slug,
      speciesRow.scientificName,
      speciesRow.recordJson,
    ]);
    await conn.execute(BLOGPOST_UPSERT_SQL, [
      bp.slug,
      bp.speciesSlug,
      bp.status,
      bp.titleEs,
      bp.titleEn,
      bp.excerptEs,
      bp.excerptEn,
      bp.bodyEs,
      bp.bodyEn,
      bp.coverImagePrompt,
    ]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }

  console.log(
    `✓ Upserted ${speciesRow.slug} (species record + DRAFT blogpost) into the DB. ` +
      'The blogpost is a DRAFT (status = 0); a human reviews and publishes it in the web writing desk.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
