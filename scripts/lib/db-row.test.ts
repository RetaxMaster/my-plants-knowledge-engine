import { describe, expect, it } from 'vitest';
import type { SpeciesRecord } from '@retaxmaster/my-plants-species-schema';
import { buildSpeciesRow } from './db-row.js';

const record = {
  scientificName: 'Nephrolepis exaltata',
  commonNames: ['Boston fern'],
  watering: { baseIntervalDays: 4, soilDrynessBeforeWatering: 'keep-moist', droughtTolerance: 'low', temperatureSensitivity: 'medium', lightSensitivity: 'medium', humiditySensitivity: 'high', reduceInDormancy: false },
  misting: { benefit: 'beneficial', baseFrequencyDays: 3, note: null },
  light: { minimum: 'medium', ideal: 'bright-indirect', maximum: 'bright-indirect' },
  temperature: { survivalMinC: 7, idealMinC: 16, idealMaxC: 24, survivalMaxC: 30 },
  humidity: { minimumPct: 50, idealPct: 80 },
  fertilizing: { activeSeasons: ['spring', 'summer'], inSeasonFrequencyDays: 30, reduceInDormancy: true },
  repotting: { typicalIntervalMonths: 18, signs: [] },
  maintenance: { pruning: 'Trim dead fronds.', rotationDays: 14, leafCleaningDays: null, commonPests: [] },
  nativeClimate: { description: 'Humid tropical forests.', hardinessMinC: 7, hardinessMaxC: 32 },
  cultivars: [{ name: 'Bostoniensis', alsoKnownAs: [], group: null, description: 'Arching, finely divided fronds.', careNote: null }],
  metadata: { confidence: 'high', sources: [{ title: 'RHS', url: 'https://www.rhs.org.uk/', accessedAt: '2026-06-18' }] },
} satisfies SpeciesRecord;

describe('buildSpeciesRow', () => {
  it('derives slug + scientificName + a JSON record string + both briefs', () => {
    const row = buildSpeciesRow(
      record,
      '# Boston fern\n\nA lush, humidity-loving fern.',
      '# Helecho de Boston\n\nUn helecho frondoso que ama la humedad.',
    );
    expect(row.slug).toBe('nephrolepis-exaltata');
    expect(row.scientificName).toBe('Nephrolepis exaltata');
    expect(JSON.parse(row.recordJson).light.ideal).toBe('bright-indirect');
    expect(row.briefEn).toContain('Boston fern');
    expect(row.briefEs).toContain('Helecho de Boston');
  });
});
