import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { validateCuration } from './lib/validate.js';

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { record: { type: 'string' } } });
  if (!values.record) {
    console.error('Usage: npm run validate -- --record <path-to-draft.json>');
    process.exit(2);
  }
  const raw = await readFile(values.record, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`✗ ${values.record} is not valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }
  const result = validateCuration(parsed);
  if (result.ok) {
    console.log(`✓ Valid species record for ${result.record.scientificName}`);
    if (result.record.growthHabit === 'other') {
      const reason = (parsed as { growthHabitOtherReason?: unknown })?.growthHabitOtherReason;
      console.log(`  growthHabit override accepted: ${reason}`);
    }
    return;
  }
  console.error('✗ Invalid species record:');
  for (const issue of result.issues) console.error(`  - ${issue}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
