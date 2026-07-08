import { describe, expect, it } from 'vitest';
import { validateRecord } from './validate.js';

const valid = {
  scientificName: 'Monstera deliciosa',
  commonNamesEn: ['Swiss cheese plant'],
  commonNamesEs: ['Costilla de Adán'],
  watering: {
    baseIntervalDays: 7,
    soilDrynessBeforeWatering: 'half-dry',
    droughtTolerance: 'medium',
    temperatureSensitivity: 'high',
    lightSensitivity: 'medium',
    reduceInDormancy: true,
  },
  light: { minimum: 'medium', ideal: 'bright-indirect', maximum: 'direct' },
  temperature: { survivalMinC: 5, idealMinC: 18, idealMaxC: 27, survivalMaxC: 35 },
  humidity: { minimumPct: 40, idealPct: 60 },
  fertilizing: { activeSeasons: ['spring', 'summer'], inSeasonFrequencyDays: 14, reduceInDormancy: true },
  repotting: { typicalIntervalMonths: 24, signs: [] },
  maintenance: { pruning: 'Trim leggy stems.', rotationDays: 14, leafCleaningDays: 30, commonPests: [] },
  nativeClimate: { description: 'Tropical understory.', hardinessMinC: 10, hardinessMaxC: 38 },
  metadata: {
    confidence: 'high',
    sources: [{ title: 'RHS', url: 'https://www.rhs.org.uk/', accessedAt: '2026-06-18' }],
    briefPath: 'brief.md',
  },
};

describe('validateRecord', () => {
  it('returns ok=true and the typed record for valid input', () => {
    const result = validateRecord(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.scientificName).toBe('Monstera deliciosa');
    }
  });

  it('returns ok=false with human-readable issues for invalid input', () => {
    const result = validateRecord({ ...valid, humidity: { minimumPct: 40, idealPct: 150 } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.join('\n')).toMatch(/humidity/);
    }
  });
});
