import { describe, expect, it } from 'vitest';
import { validateRecord, validateCuration, validateWritableRecord } from './validate.js';

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
  // NOTE: no `signs` key — D42 removed it from the record and the WRITE schema now REJECTS it outright
  // (0.19.0). The signs live in the structured `repot_signs` catalogue, curated by `repot_signs_researcher`.
  repotting: { typicalIntervalMonths: 24 },
  maintenance: { pruning: 'Trim leggy stems.', rotationDays: 14, leafCleaningDays: 30, commonPests: [] },
  nativeClimate: { description: 'Tropical understory.', hardinessMinC: 10, hardinessMaxC: 38 },
  metadata: {
    confidence: 'high',
    sources: [{ title: 'RHS', url: 'https://www.rhs.org.uk/', accessedAt: '2026-06-18' }],
    briefPath: 'brief.md',
  },
};

// A fully bilingual, fully valid curated record — the shape the strict write gate (speciesRecordWriteSchema)
// requires: every localized field is authored in BOTH locales as `{ en, es }`, never a bare string/array.
// Module-scope so both the growthHabit gate's `describe` and the strict-write-gate's `describe` below can
// read it.
const CURATED_RECORD = {
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
  misting: {
    benefit: 'beneficial',
    baseFrequencyDays: 3,
    note: {
      en: 'Mist in the morning so the foliage dries before nightfall.',
      es: 'Rocía por la mañana para que el follaje se seque antes de la noche.',
    },
  },
  light: { minimum: 'medium', ideal: 'bright-indirect', maximum: 'direct' },
  temperature: { survivalMinC: 5, idealMinC: 18, idealMaxC: 27, survivalMaxC: 35 },
  humidity: { minimumPct: 40, idealPct: 60 },
  fertilizing: { activeSeasons: ['spring', 'summer'], inSeasonFrequencyDays: 14, reduceInDormancy: true },
  // NOTE: no `signs` key — D42 removed it from the record and the WRITE schema now REJECTS it outright
  // (0.19.0). The signs live in the structured `repot_signs` catalogue, curated by `repot_signs_researcher`.
  repotting: { typicalIntervalMonths: 24 },
  maintenance: {
    pruning: { en: 'Trim leggy stems.', es: 'Recorta los tallos alargados.' },
    rotationDays: 14,
    leafCleaningDays: 30,
    commonPests: { en: [], es: [] },
  },
  nativeClimate: {
    description: { en: 'Tropical understory.', es: 'Sotobosque tropical.' },
    hardinessMinC: 10,
    hardinessMaxC: 38,
  },
  cultivars: [],
  growthHabit: null,
  metadata: {
    confidence: 'high',
    sources: [{ title: 'RHS', url: 'https://www.rhs.org.uk/', accessedAt: '2026-06-18' }],
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
    // validateCuration now runs the strict write gate FIRST (Spec 3 §4.2), so its own fixture must be the
    // fully bilingual shape — `valid` is intentionally the legacy shape used above to prove the tolerant
    // reader still accepts it, and it is not writable anymore.
    const { growthHabit, ...withoutGrowthHabit } = structuredClone(CURATED_RECORD);
    const result = validateCuration(withoutGrowthHabit);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join('\n')).toMatch(/growthHabit/);
  });

  it('rejects an explicit null growthHabit on a curation', () => {
    expect(validateCuration({ ...CURATED_RECORD, growthHabit: null }).ok).toBe(false);
  });

  it('accepts a real vocabulary value with no reason required', () => {
    expect(validateCuration({ ...CURATED_RECORD, growthHabit: 'trailing' }).ok).toBe(true);
  });

  // BLOCKER 8: "other" is the UNKNOWN override — the spec requires it to record WHY. Bare "other" is NOT
  // enough; a non-empty growthHabitOtherReason must accompany it, or the gate fails.
  it('rejects "other" WITHOUT a recorded reason (bare override is insufficient)', () => {
    const result = validateCuration({ ...CURATED_RECORD, growthHabit: 'other' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join('\n')).toMatch(/growthHabitOtherReason|reason/i);
  });

  it('rejects "other" with an empty/whitespace reason', () => {
    expect(
      validateCuration({ ...CURATED_RECORD, growthHabit: 'other', growthHabitOtherReason: '   ' }).ok,
    ).toBe(false);
  });

  it('accepts "other" WITH a recorded reason', () => {
    expect(validateCuration({
      ...CURATED_RECORD, growthHabit: 'other',
      growthHabitOtherReason: 'Mixed rosette-and-trailing form; no single dominant habit.',
    }).ok).toBe(true);
  });
});

describe('the strict write gate (Spec 3 §4.2)', () => {
  const curated = () => structuredClone(CURATED_RECORD); // this file's fully-bilingual fixture

  it('ACCEPTS a fully bilingual payload', () => {
    expect(validateWritableRecord(curated()).ok).toBe(true);
  });

  it.each([
    ['maintenance.pruning', (r: any) => { r.maintenance.pruning = 'Trim.'; }],
    ['maintenance.commonPests', (r: any) => { r.maintenance.commonPests = ['Mites']; }],
    ['nativeClimate.description', (r: any) => { r.nativeClimate.description = 'Understorey.'; }],
    ['misting.note', (r: any) => { r.misting.note = 'Mist at dawn.'; }],
  ])('REJECTS a legacy English-only %s', (field, mutate) => {
    const payload = curated();
    mutate(payload);
    const result = validateWritableRecord(payload);
    expect(result.ok).toBe(false);
    // Same issue-list SHAPE validateRecord already returns for any other failure — one string per issue,
    // `path: message` — so the CLIs print it with the loop they already have.
    if (!result.ok) {
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.issues.join('\n')).toContain(field.split('.')[0]);
    }
  });

  it('runs on the RAW payload, BEFORE the tolerant transform could upgrade it', () => {
    // The reader's own transform is exactly what accepts a legacy string. If the gate ran after it, the
    // gate could never fail — so this asserts the tolerant reader still accepts what the gate refuses.
    const payload: any = curated();
    payload.maintenance.pruning = 'Trim.';
    expect(validateRecord(payload).ok).toBe(true);
    expect(validateWritableRecord(payload).ok).toBe(false);
  });

  it('validateCuration applies the gate on top of its growthHabit rules', () => {
    const payload: any = curated();
    payload.maintenance.pruning = 'Trim.';
    expect(validateCuration(payload).ok).toBe(false);
  });
});
