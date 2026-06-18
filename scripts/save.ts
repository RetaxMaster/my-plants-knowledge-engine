import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildSpeciesArtifacts } from './lib/artifacts.js';
import { validateRecord } from './lib/validate.js';

async function dirExists(dir: string): Promise<boolean> {
  try {
    await access(dir);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      record: { type: 'string' },
      brief: { type: 'string' },
      'species-root': { type: 'string', default: 'species' },
      force: { type: 'boolean', default: false },
    },
  });
  if (!values.record || !values.brief) {
    console.error('Usage: npm run save -- --record <draft.json> --brief <draft.md> [--species-root species] [--force]');
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
    console.error('✗ Refusing to save — invalid species record:');
    for (const issue of validated.issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  const brief = await readFile(values.brief, 'utf8');
  const speciesRoot = path.resolve(values['species-root'] as string);
  const artifacts = buildSpeciesArtifacts(speciesRoot, validated.record, brief);

  // Curated data is precious — never silently overwrite an existing species.
  if (!values.force && (await dirExists(artifacts.dir))) {
    console.error(`✗ ${artifacts.slug} already exists at ${artifacts.dir}. Re-run with --force to overwrite.`);
    process.exit(1);
  }

  await mkdir(artifacts.dir, { recursive: true });
  await writeFile(artifacts.recordPath, artifacts.recordJson, 'utf8');
  await writeFile(artifacts.briefPath, artifacts.briefContent, 'utf8');

  console.log(`✓ Saved ${artifacts.slug}`);
  console.log(`  record: ${artifacts.recordPath}`);
  console.log(`  brief:  ${artifacts.briefPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
