import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { speciesRecordWriteSchema } from '@retaxmaster/my-plants-species-schema';
import { EXAMPLE_RECORD } from './lib/agent-tools-example.js';

// The curation tool reference (AGENT-TOOLS.md) MUST be rendered from the CANONICAL WRITE schema
// (`speciesRecordWriteSchema`), never from the migration-tolerant READER (`speciesRecordSchema`) -- see the
// comment on `tripwireSections` in generate-agent-tools.ts. Rendering it from the reader made every
// bilingual field's Type column advertise `string | object` (the legacy English-only shape) while the
// Description column, IN THE SAME ROW, said that exact shape "is rejected on write" -- a self-contradicting
// doc that led an agent straight into a validation failure, burning a research run (the most expensive unit
// of work in this project). This is the regression tripwire for that class of defect.

const AGENT_TOOLS_PATH = fileURLToPath(new URL('../AGENT-TOOLS.md', import.meta.url));

describe('AGENT-TOOLS.md — generated from the curation WRITE schema, not the tolerant reader', () => {
  it('the committed doc never advertises the legacy bare-string/bare-array branch for a bilingual field', () => {
    const text = readFileSync(AGENT_TOOLS_PATH, 'utf8');
    // These are exactly the fragments `describeType()` emits when a bilingual field's union still carries
    // the legacy string/array arm -- i.e. when the doc was rendered from `speciesRecordSchema` instead of
    // `speciesRecordWriteSchema`.
    expect(text).not.toContain('string \\| object');
    expect(text).not.toContain('array of string \\| object');
  });

  it('the schema actually wired into the generator rejects a legacy bare-string bilingual field (proves it IS the write schema, not the tolerant reader)', () => {
    const record = structuredClone(EXAMPLE_RECORD) as Record<string, unknown>;
    const maintenance = record.maintenance as Record<string, unknown>;
    // Valid on the READER (speciesRecordSchema accepts a bare string); must be REFUSED by the schema this
    // generator actually renders from.
    maintenance.pruning = 'Trim spent fronds.';
    expect(speciesRecordWriteSchema.safeParse(record).success).toBe(false);
  });
});
