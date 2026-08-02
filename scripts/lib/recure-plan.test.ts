import { describe, expect, it } from 'vitest';
import type { SpeciesRecord } from '@retaxmaster/my-plants-species-schema';
import { buildRecurePlan } from './recure-plan.js';

// A fully bilingual, fully valid curated record — the shape buildSpeciesRow expects. Same minimal shape
// as the db-row.test.ts fixture; see that file for the canonical example this is modeled on.
const record = {
  scientificName: 'Nephrolepis biserrata',
  commonNamesEn: ['Giant sword fern'],
  commonNamesEs: ['Helecho espada gigante'],
  watering: {
    baseIntervalDays: 4,
    soilDrynessBeforeWatering: 'keep-moist',
    droughtTolerance: 'low',
    temperatureSensitivity: 'medium',
    lightSensitivity: 'medium',
    humiditySensitivity: 'high',
    reduceInDormancy: false,
  },
  misting: { benefit: 'beneficial', baseFrequencyDays: 3, note: null },
  light: { minimum: 'medium', ideal: 'bright-indirect', maximum: 'bright-indirect' },
  temperature: { survivalMinC: 7, idealMinC: 16, idealMaxC: 24, survivalMaxC: 30 },
  humidity: { minimumPct: 50, idealPct: 80 },
  fertilizing: { activeSeasons: ['spring', 'summer'], inSeasonFrequencyDays: 30, reduceInDormancy: true },
  repotting: { typicalIntervalMonths: 18, signs: [] },
  maintenance: { pruning: 'Trim dead fronds.', rotationDays: 14, leafCleaningDays: null, commonPests: [] },
  nativeClimate: { description: 'Humid tropical forests.', hardinessMinC: 7, hardinessMaxC: 32 },
  cultivars: [],
  growthHabit: null,
  metadata: {
    confidence: 'high',
    sources: [{ title: 'RHS', url: 'https://www.rhs.org.uk/', accessedAt: '2026-06-18' }],
  },
} satisfies SpeciesRecord;

describe('buildRecurePlan — the statements a re-curation is allowed to run', () => {
  it('plans the species upsert with the record and the brief', () => {
    const plan = buildRecurePlan({ record, draft: record, brief: '# Brief\n', signRows: null });
    expect(plan.slug).toBe('nephrolepis-biserrata');
    expect(plan.statements).toHaveLength(1);
    expect(plan.statements[0].sql).toContain('INSERT INTO `species`');
    expect(plan.statements[0].params).toEqual([
      'nephrolepis-biserrata',
      'Nephrolepis biserrata',
      expect.any(String),
      '# Brief\n',
    ]);
  });

  it('NEVER plans a statement that touches the blogposts table — the single most important safety property', () => {
    // A re-curation that silently unpublished or rewrote the owner's live species guides would be exactly
    // the surprise this mode exists to prevent. The full-insert path's draft-on-edit behaviour lives in
    // db-insert.ts and db:recure never reaches it.
    const plan = buildRecurePlan({ record, draft: record, brief: '# Brief\n', signRows: null });
    for (const s of plan.statements) {
      expect(s.sql.toLowerCase()).not.toContain('blogpost');
      expect(s.sql.toLowerCase()).not.toContain('status');
    }
  });

  it('refuses a missing brief — a re-curation without its brief is the one thing it exists to write', () => {
    expect(() => buildRecurePlan({ record, draft: record, brief: '', signRows: null })).toThrow(/brief/i);
  });

  it('refuses a whitespace-only brief the same way — trimmed emptiness is still emptiness', () => {
    expect(() => buildRecurePlan({ record, draft: record, brief: '   \n\t ', signRows: null })).toThrow(
      /brief/i,
    );
  });
});
