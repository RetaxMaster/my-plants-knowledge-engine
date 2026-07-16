import { describe, expect, it } from 'vitest';
import { validateRecord, validateCuration } from './validate.js';

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

describe('validateCuration — the new-curation growthHabit gate (spec §2.3)', () => {
  it('shared validateRecord STILL accepts a legacy record with no growthHabit (contract stays nullable)', () => {
    expect(validateRecord(valid).ok).toBe(true);
  });

  it('rejects a fresh/enrich curation that omits growthHabit', () => {
    const result = validateCuration(valid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join('\n')).toMatch(/growthHabit/);
  });

  it('rejects an explicit null growthHabit on a curation', () => {
    expect(validateCuration({ ...valid, growthHabit: null }).ok).toBe(false);
  });

  it('accepts a real vocabulary value with no reason required', () => {
    expect(validateCuration({ ...valid, growthHabit: 'trailing' }).ok).toBe(true);
  });

  // BLOCKER 8: "other" is the UNKNOWN override — the spec requires it to record WHY. Bare "other" is NOT
  // enough; a non-empty growthHabitOtherReason must accompany it, or the gate fails.
  it('rejects "other" WITHOUT a recorded reason (bare override is insufficient)', () => {
    const result = validateCuration({ ...valid, growthHabit: 'other' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join('\n')).toMatch(/growthHabitOtherReason|reason/i);
  });

  it('rejects "other" with an empty/whitespace reason', () => {
    expect(validateCuration({ ...valid, growthHabit: 'other', growthHabitOtherReason: '   ' }).ok).toBe(false);
  });

  it('accepts "other" WITH a recorded reason', () => {
    expect(validateCuration({
      ...valid, growthHabit: 'other',
      growthHabitOtherReason: 'Mixed rosette-and-trailing form; no single dominant habit.',
    }).ok).toBe(true);
  });
});
