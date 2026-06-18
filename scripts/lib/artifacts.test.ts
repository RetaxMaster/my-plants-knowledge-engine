import { describe, expect, it } from 'vitest';
import type { SpeciesRecord } from '@retaxmaster/my-plants-species-schema';
import { buildSpeciesArtifacts } from './artifacts.js';

const record = {
  scientificName: 'Ficus lyrata',
  commonNames: ['Fiddle-leaf fig'],
  watering: {
    baseIntervalDays: 9,
    soilDrynessBeforeWatering: 'top-inch-dry',
    droughtTolerance: 'low',
    temperatureSensitivity: 'medium',
    lightSensitivity: 'high',
    reduceInDormancy: true,
  },
  light: { minimum: 'medium', ideal: 'bright-indirect', maximum: 'direct' },
  temperature: { survivalMinC: 10, idealMinC: 18, idealMaxC: 29, survivalMaxC: 35 },
  humidity: { minimumPct: 40, idealPct: 65 },
  fertilizing: { activeSeasons: ['spring', 'summer'], inSeasonFrequencyDays: 21, reduceInDormancy: true },
  repotting: { typicalIntervalMonths: 24, signs: [] },
  maintenance: { pruning: 'Shape in spring.', rotationDays: 7, leafCleaningDays: 21, commonPests: [] },
  nativeClimate: { description: 'West African lowland rainforest.', hardinessMinC: 10, hardinessMaxC: 38 },
  metadata: {
    confidence: 'medium',
    sources: [{ title: 'RHS', url: 'https://www.rhs.org.uk/', accessedAt: '2026-06-18' }],
    briefPath: 'brief.md',
  },
} satisfies SpeciesRecord;

describe('buildSpeciesArtifacts', () => {
  it('derives the slug via the shared helper, builds paths, pretty JSON, and forces briefPath', () => {
    const artifacts = buildSpeciesArtifacts('/repo/species', record, '# Ficus lyrata\n');
    expect(artifacts.slug).toBe('ficus-lyrata');
    expect(artifacts.recordPath).toBe('/repo/species/ficus-lyrata/record.json');
    expect(artifacts.briefPath).toBe('/repo/species/ficus-lyrata/brief.md');
    expect(artifacts.briefContent).toBe('# Ficus lyrata\n');
    expect(artifacts.recordJson.endsWith('\n')).toBe(true);
    expect(JSON.parse(artifacts.recordJson).metadata.briefPath).toBe('brief.md');
  });
});
