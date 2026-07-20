#!/usr/bin/env tsx
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { speciesRecordSchema, blogpostInputSchema } from '@retaxmaster/my-plants-species-schema';
import { renderToolDoc, assertInvariantsCover, syncToolDoc, type InvariantMap } from '@retaxmaster/my-plants-species-schema/tool-doc';
import { EXAMPLE_RECORD, EXAMPLE_BLOGPOST } from './lib/agent-tools-example.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO_ROOT, 'AGENT-TOOLS.md');

// Pass ALL top-level record sections to the tripwire so that if ANY section GAINS a .refine() later
// (not just today's five), the build fails until it is documented. hasRefinement peels wrappers, so a
// section like `misting` (a .default()-wrapped .refine()) is detected.
const recordSections = speciesRecordSchema.shape as Record<string, import('zod').ZodTypeAny>;

const invariants: InvariantMap = {
  schemaAttached: {
    misting: 'baseFrequencyDays must be null when benefit is `avoid`, and set (a positive integer) otherwise.',
    light: 'minimum <= ideal <= maximum, by the light-level ranking low < medium < bright-indirect < direct.',
    temperature: 'survivalMinC <= idealMinC <= idealMaxC <= survivalMaxC.',
    humidity: 'minimumPct <= idealPct.',
    nativeClimate: 'hardinessMinC <= hardinessMaxC.',
  },
  external: [
    'growthHabit: a fresh/enrich curation must set it; the sentinel value `other` is accepted ONLY with a non-empty `growthHabitOtherReason` (a KE-curation field enforced in scripts/lib/validate.ts — it is NOT part of the shared record, so there is no structural tripwire for it).',
  ],
};

assertInvariantsCover(recordSections, invariants);

const body = renderToolDoc({
  title: 'Knowledge Engine — tool reference',
  intro: 'The `plant_researcher` fills the **species record**; the `editorial_writer` fills the **blogpost**. Both are validated on insert. Copy an example below, change the values, and keep every required field.',
  tools: [
    { name: 'species record', schema: speciesRecordSchema, example: EXAMPLE_RECORD, description: 'The curated care record. Sections with a cross-field invariant are listed under "Cross-field invariants" below.' },
    { name: 'blogpost (seven keys)', schema: blogpostInputSchema, example: EXAMPLE_BLOGPOST, description: 'Spanish leads (required); English keys may be null.' },
  ],
  invariants,
});

const mode = process.argv.includes('--check') ? 'check' : 'write';
const r = syncToolDoc({ path: OUT, content: body, mode, currentReader: () => (existsSync(OUT) ? readFileSync(OUT, 'utf8') : null), writer: (c) => writeFileSync(OUT, c) });
if (r.problems.length) { console.error(r.problems.join('\n')); process.exit(1); }
console.log(r.wrote ? `wrote ${OUT}` : 'AGENT-TOOLS.md OK');
